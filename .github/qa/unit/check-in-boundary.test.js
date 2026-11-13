// Controller-level tests with a fixed clock and mocked persistence, NOT HTTP/manual execution.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Appointment = require('../../../server/src/models/Appointment');
const { checkIn } = require('../../../server/src/controllers/appointmentController');
const now = Date.UTC(2026, 10, 13, 9, 0, 0);
for (const [offset, allowed] of [[-1800001, false], [-1800000, true], [-1799999, true],
  [1799999, true], [1800000, true], [1800001, false]]) {
  test(`TC-APPT-012 / controller clock boundary: now-startTime=${offset}ms allowed=${allowed}`, async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now });
    let stored = { _id: '507f1f77bcf86cd799439011', startTime: new Date(now - offset),
      updatedAt: new Date(now - 10000), status: 'Đã lên lịch' };
    const original = { ...stored };
    t.mock.method(Appointment, 'findById', async () => ({ ...stored }));
    const write = t.mock.method(Appointment, 'findOneAndUpdate', async (filter, update) => {
      assert.equal(filter.status, 'Đã lên lịch');
      stored = { ...stored, ...update.$set };
      return { toJSON: () => stored };
    });
    const res = { code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await checkIn({ params: { id: stored._id } }, res, (error) => { throw error; });
    assert.equal(res.code, allowed ? 200 : 400);
    assert.equal(write.mock.callCount(), allowed ? 1 : 0);
    if (allowed) {
      assert.equal(stored.status, 'Đã đến');
      assert.equal(stored.checkInTime.getTime(), now);
      assert.equal(res.body.data.status, 'Đã đến');
    } else {
      assert.deepEqual(stored, original);
      assert.equal(res.body.data, undefined);
    }
  });
}
