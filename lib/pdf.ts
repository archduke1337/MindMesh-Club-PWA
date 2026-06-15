/**
 * Mind Mesh — PDF Generation Service
 * 
 * Generates PDF lists of event registrations for admins and heads.
 */

import type { Registration, Ticket, Event, Profile } from "@/lib/types";

/**
 * Generate HTML content for event registration PDF.
 */
export function generateRegistrationPDF(params: {
  event: Event;
  registrations: (Registration & { user?: { name: string; email: string }; profile?: Profile; ticket?: Ticket })[];
  generatedBy: string;
  generatedAt: string;
}): string {
  const { event, registrations, generatedBy, generatedAt } = params;

  const rows = registrations
    .map((reg, index) => {
      const name = reg.user?.name || "Unknown";
      const email = reg.user?.email || "Unknown";
      const urn = reg.profile?.urn || "N/A";
      const department = reg.profile?.program
        ? `${reg.profile.program} - ${reg.profile.branch || ""}`
        : "N/A";
      const status = reg.ticket?.status || reg.status;
      const registeredAt = new Date(reg.registeredAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${urn}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${department}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${status}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${registeredAt}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Event Registrations - ${event.title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #8b5cf6;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #8b5cf6;
          margin: 0;
          font-size: 28px;
        }
        .header h2 {
          color: #666;
          margin: 10px 0 0 0;
          font-weight: normal;
          font-size: 18px;
        }
        .event-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .event-info div {
          flex: 1;
        }
        .event-info strong {
          display: block;
          margin-bottom: 5px;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #8b5cf6;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
        }
        td {
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        tr:hover {
          background: #f0f0f0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #888;
          display: flex;
          justify-content: space-between;
        }
        .stats {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        .stat {
          padding: 10px 20px;
          background: #f0f0f0;
          border-radius: 6px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #8b5cf6;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Mind Mesh Club</h1>
        <h2>Event Registration List</h2>
      </div>

      <div class="event-info">
        <div>
          <strong>Event</strong>
          ${event.title}
        </div>
        <div>
          <strong>Date</strong>
          ${new Date(event.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <div>
          <strong>Venue</strong>
          ${event.venue}
        </div>
        <div>
          <strong>Capacity</strong>
          ${event.registered} / ${event.capacity}
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-value">${registrations.length}</div>
          <div class="stat-label">Total Registrations</div>
        </div>
        <div class="stat">
          <div class="stat-value">${
            registrations.filter((r) => r.ticket?.status === "checked_in" || r.status === "checked_in").length
          }</div>
          <div class="stat-label">Checked In</div>
        </div>
        <div class="stat">
          <div class="stat-value">${
            registrations.filter((r) => r.ticket?.status === "issued" || r.status === "approved").length
          }</div>
          <div class="stat-label">Confirmed</div>
        </div>
        <div class="stat">
          <div class="stat-value">${
            registrations.filter((r) => r.status === "pending").length
          }</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>URN</th>
            <th>Department</th>
            <th>Status</th>
            <th>Registered</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='7' style='text-align: center; padding: 20px;'>No registrations yet</td></tr>"}
        </tbody>
      </table>

      <div class="footer">
        <div>Generated by: ${generatedBy}</div>
        <div>Date: ${new Date(generatedAt).toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</div>
        <div>Mind Mesh Club © ${new Date().getFullYear()}</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Download HTML as PDF (uses browser print).
 * In production, you'd use a library like jsPDF or puppeteer.
 */
export function downloadPDF(html: string, filename: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  } else {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Generate and download event registration PDF.
 */
export function generateAndDownloadRegistrationPDF(params: {
  event: Event;
  registrations: (Registration & { user?: { name: string; email: string }; profile?: Profile; ticket?: Ticket })[];
  generatedBy: string;
}): void {
  const html = generateRegistrationPDF({
    ...params,
    generatedAt: new Date().toISOString(),
  });

  const filename = `event-registrations-${params.event.slug}-${new Date().toISOString().split("T")[0]}.pdf`;
  downloadPDF(html, filename);
}
