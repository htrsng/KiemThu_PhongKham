function redact(value) {
  let text = String(value);
  for (const key of ['ADMIN_PASS', 'DOCTOR_PASS', 'RECEPTION_PASS', 'JWT_SECRET']) {
    if (process.env[key]) text = text.split(process.env[key]).join('[REDACTED]');
  }
  return text.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED JWT]');
}
module.exports = { redact };
