# Test Faculty Selection App

This is a minimal example of a Node.js/Express application that allows each
student to select one faculty member for every subject.  Each subject starts
with three faculties, each offering 70 slots.  A student's roll number must
begin with `23` and be 10 characters long.  Once a student submits choices the
record is stored and cannot be changed.

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

The server runs on port `3000`.  Open `http://localhost:3000` in your browser to
access the form.  Enter a valid roll number (starting with `23`), your name and
select one faculty for each subject.  Slot counts update immediately after a
successful submission.

## Concurrency

The server uses a mutex to ensure updates to faculty slots are atomic even when multiple students submit concurrently. It can handle around 300 simultaneous users depending on your hardware.

Each time a student submits their choices, the available slots are immediately updated and saved to `data.json`. A student cannot change their choices once stored.
