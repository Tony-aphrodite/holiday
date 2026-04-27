import { Resend } from 'resend';

let cached: Resend | null = null;

export function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export function fromAddress(): string {
  // Use a verified domain once configured; otherwise fall back to Resend's
  // shared onboarding sender which works for testing out of the box.
  return process.env.EMAIL_FROM ?? 'Holidaze <onboarding@resend.dev>';
}

export interface HolidayForEmail {
  customerName: string;
  countryName: string;
  flag: string;
  holidayName: string;        // English (primary)
  holidayNameLocal?: string;  // Native (in parentheses), if different
  holidayDate: string;        // ISO YYYY-MM-DD
  daysUntil: number;
  type: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string, tz: string): string {
  try {
    const d = new Date(iso + 'T00:00:00Z');
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: tz,
    }).format(d);
  } catch {
    return iso;
  }
}

export function renderHolidayEmail(
  recipientName: string,
  holidays: HolidayForEmail[],
  tz: string,
): { subject: string; html: string; text: string } {
  const count = holidays.length;
  const firstHoliday = holidays[0];
  const firstName = firstHoliday.holidayNameLocal
    ? `${firstHoliday.holidayName} (${firstHoliday.holidayNameLocal})`
    : firstHoliday.holidayName;
  const subject =
    count === 1
      ? `Upcoming holiday: ${firstName} for ${firstHoliday.customerName}`
      : `${count} upcoming customer holidays`;

  const rows = holidays
    .map((h) => {
      const when =
        h.daysUntil === 0
          ? 'Today'
          : h.daysUntil === 1
            ? 'Tomorrow'
            : `In ${h.daysUntil} days`;
      return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
            <div style="font-size:14px;font-weight:600;color:#111827;">
              ${escapeHtml(h.flag)} ${escapeHtml(h.customerName)}
            </div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">
              ${escapeHtml(h.countryName)} · ${escapeHtml(h.type)}
            </div>
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
            <div style="font-size:14px;color:#111827;">
              ${escapeHtml(h.holidayName)}${
                h.holidayNameLocal && h.holidayNameLocal !== h.holidayName
                  ? ` <span style="color:#6b7280;font-weight:400;">(${escapeHtml(h.holidayNameLocal)})</span>`
                  : ''
              }
            </div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">
              ${escapeHtml(formatDate(h.holidayDate, tz))}
            </div>
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;">
            <div style="
              display:inline-block;
              padding:4px 10px;
              font-size:12px;
              font-weight:600;
              color:${h.daysUntil <= 1 ? '#92400e' : '#1e3a8a'};
              background:${h.daysUntil <= 1 ? '#fef3c7' : '#dbeafe'};
              border-radius:999px;
            ">${escapeHtml(when)}</div>
          </td>
        </tr>`;
    })
    .join('');

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6485ff,#8b5cf6);color:#fff;display:inline-block;text-align:center;line-height:32px;font-weight:700;">H</div>
        <div style="font-size:16px;font-weight:700;color:#111827;">Holidaze</div>
      </div>

      <h1 style="font-size:22px;line-height:1.3;color:#111827;margin:0 0 8px;">
        Hi ${escapeHtml(recipientName)} 👋
      </h1>
      <p style="font-size:14px;color:#4b5563;margin:0 0 24px;line-height:1.6;">
        ${
          count === 1
            ? 'One of your customers has a national holiday coming up. Here are the details so you can reach out at the right moment:'
            : `${count} of your customers have national holidays coming up. Here's a quick rundown so you can reach out at the right moments:`
        }
      </p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;border-collapse:separate;overflow:hidden;">
        ${rows}
      </table>

      <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;line-height:1.6;">
        You're receiving this because email notifications are enabled in your
        Holidaze settings. You can change the lead time, delivery hour, or
        turn these off entirely in
        <a href="https://holiday-teal.vercel.app/#/settings" style="color:#4360f5;text-decoration:none;">Settings</a>.
      </p>
    </div>
  </body>
</html>`.trim();

  const textLines = [
    `Hi ${recipientName},`,
    '',
    count === 1
      ? 'One of your customers has a national holiday coming up:'
      : `${count} of your customers have national holidays coming up:`,
    '',
    ...holidays.map((h) => {
      const when =
        h.daysUntil === 0 ? 'Today' : h.daysUntil === 1 ? 'Tomorrow' : `In ${h.daysUntil} days`;
      const holidayLabel =
        h.holidayNameLocal && h.holidayNameLocal !== h.holidayName
          ? `${h.holidayName} (${h.holidayNameLocal})`
          : h.holidayName;
      return `- ${h.customerName} (${h.countryName}) — ${holidayLabel} — ${formatDate(h.holidayDate, tz)} — ${when}`;
    }),
    '',
    'Manage your notification settings: https://holiday-teal.vercel.app/#/settings',
    '',
    '— Holidaze',
  ];

  return { subject, html, text: textLines.join('\n') };
}

export async function sendHolidayEmail(
  to: string,
  recipientName: string,
  holidays: HolidayForEmail[],
  tz: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured.' };
  const { subject, html, text } = renderHolidayEmail(recipientName, holidays, tz);
  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to,
      subject,
      html,
      text,
    });
    if (error) return { ok: false, error: error.message ?? 'Send failed.' };
    return { ok: true, id: data?.id ?? 'unknown' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Send failed.' };
  }
}
