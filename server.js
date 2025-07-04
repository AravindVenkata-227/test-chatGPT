const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const { Mutex } = require('async-mutex');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataFile = path.join(__dirname, 'data.json');
const mutex = new Mutex();

async function readData() {
  try {
    const content = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const initData = { slots: {}, students: {} };
      for (let i = 1; i <= 6; i++) {
        initData.slots[`subject${i}`] = { faculty1: 70, faculty2: 70, faculty3: 70 };
      }
      await fs.writeFile(dataFile, JSON.stringify(initData, null, 2));
      return initData;
    }
    throw err;
  }
}

async function writeData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

app.get('/data', async (req, res) => {
  const release = await mutex.acquire();
  try {
    const data = await readData();
    res.json(data.slots);
  } finally {
    release();
  }
});

app.post('/submit', async (req, res) => {
  const { roll, name, selections } = req.body;
  if (!roll || !name || typeof selections !== 'object') {
    return res.status(400).json({ error: 'Invalid data' });
  }
  if (!/^23.{8}$/.test(roll)) {
    return res.status(400).json({ error: 'Roll number must start with 23 and be 10 characters long' });
  }
  const release = await mutex.acquire();
  try {
    const data = await readData();
    if (data.students[roll]) {
      return res.status(400).json({ error: 'Selection already submitted' });
    }
    for (let i = 1; i <= 6; i++) {
      const subjectKey = `subject${i}`;
      const faculty = selections[subjectKey];
      if (!faculty || !data.slots[subjectKey][faculty] || data.slots[subjectKey][faculty] <= 0) {
        return res.status(400).json({ error: `Invalid selection for ${subjectKey}` });
      }
    }
    for (let i = 1; i <= 6; i++) {
      const subjectKey = `subject${i}`;
      const faculty = selections[subjectKey];
      data.slots[subjectKey][faculty] -= 1;
    }
    data.students[roll] = { name, selections };
    await writeData(data);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    release();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
