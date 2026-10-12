
import { useState } from "react";

const YEAR_SECTIONS = [
  {
    key: "first_year",
    label: "First Year",
    number: "01",
    color: "#2563eb",
    light: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    key: "second_year",
    label: "Second Year",
    number: "02",
    color: "#15803d",
    light: "#f0fdf4",
    border: "#bbf7d0",
  },
  {
    key: "third_year",
    label: "Third Year",
    number: "03",
    color: "#c2410c",
    light: "#fff7ed",
    border: "#fed7aa",
  },
  {
    key: "fourth_year",
    label: "Fourth Year",
    number: "04",
    color: "#7e22ce",
    light: "#faf5ff",
    border: "#e9d5ff",
  },
];

function parseTeamMembers(value) {
  let members = value;

  if (typeof members === "string") {
    try {
      members = JSON.parse(members);
    } catch {
      return [];
    }
  }

  return Array.isArray(members)
    ? members.filter(
        (member) =>
          member &&
          typeof member === "object" &&
          !Array.isArray(member)
      )
    : [];
}

export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [registrations, setRegistrations] = useState(null);
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("Checking login...");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      const result = await fetch("/api/admin/registrations", {
        credentials: "same-origin",
      });

      const records = await result.json();

      if (!result.ok) {
        setMessage(
          records.message || "Could not load registrations."
        );
        return;
      }

      setRegistrations(records.registrations);
      setMessage("Admin login successful.");
      setPassword("");
    } catch {
      setMessage(
        "Cannot connect to the backend. Check that Flask is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalRegistrations = registrations
    ? YEAR_SECTIONS.reduce(
        (total, year) =>
          total +
          (Array.isArray(registrations[year.key])
            ? registrations[year.key].length
            : 0),
        0
      )
    : 0;

  return (
    <main className="admin-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-page {
          min-height: 100vh;
          padding: 36px 20px 60px;
          background: #f4f6fb;
          color: #172033;
          font-family: Arial, sans-serif;
        }

        .admin-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .admin-header {
          padding: 28px;
          border-radius: 18px;
          background: #111827;
          color: white;
          margin-bottom: 24px;
        }

        .admin-header h1 {
          margin: 0 0 8px;
          font-size: clamp(25px, 4vw, 34px);
        }

        .admin-header p {
          margin: 0;
          color: #cbd5e1;
          line-height: 1.6;
        }

        .admin-login {
          max-width: 440px;
          padding: 26px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 8px 25px #0f172a0a;
        }

        .admin-login h2 {
          margin-top: 0;
        }

        .admin-login label {
          display: block;
          margin: 18px 0 7px;
          font-weight: 600;
        }

        .admin-login input {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 15px;
        }

        .admin-login button {
          width: 100%;
          margin-top: 22px;
          padding: 13px;
          background: #111827;
          color: white;
          border: 0;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-message {
          margin: 18px 0;
          color: #334155;
          overflow-wrap: anywhere;
        }

        .admin-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          background: white;
          padding: 22px 26px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          margin-bottom: 28px;
        }

        .admin-summary h2 {
          margin: 0 0 6px;
          font-size: 20px;
        }

        .admin-summary p {
          margin: 0;
          color: #64748b;
        }

        .admin-total {
          min-width: 100px;
          text-align: center;
          padding: 14px 20px;
          border-radius: 12px;
          background: #eef2ff;
          color: #3730a3;
        }

        .admin-total strong {
          display: block;
          font-size: 30px;
        }

        .year-section {
          margin-bottom: 30px;
          padding: 22px;
          background: white;
          border: 1px solid var(--year-border);
          border-top: 6px solid var(--year-color);
          border-radius: 16px;
          box-shadow: 0 7px 22px #0f172a08;
        }

        .year-heading {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .year-number {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background: var(--year-light);
          color: var(--year-color);
          font-size: 22px;
          font-weight: 800;
        }

        .year-heading h2 {
          margin: 0 0 5px;
          color: var(--year-color);
          font-size: 23px;
        }

        .year-heading p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .year-count {
          margin-left: auto;
          min-width: 94px;
          padding: 12px;
          border-radius: 12px;
          text-align: center;
          background: var(--year-light);
          color: var(--year-color);
        }

        .year-count strong {
          display: block;
          font-size: 26px;
        }

        .year-count span {
          font-size: 12px;
          font-weight: 600;
        }

        .registration-card {
          padding: 18px;
          margin-top: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #fff;
          overflow: hidden;
        }

        .registration-card h3 {
          margin: 0 0 15px;
          color: var(--year-color);
          overflow-wrap: anywhere;
        }

        .registration-details {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .detail-item {
          padding: 12px;
          border-radius: 9px;
          background: #f8fafc;
          overflow-wrap: anywhere;
        }

        .detail-item span {
          display: block;
          margin-bottom: 6px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .detail-item strong {
          font-size: 14px;
        }

        .members-title {
          margin: 16px 0 10px;
          font-size: 15px;
        }

        .members-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .members-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 420px;
        }

        .members-table th {
          background: var(--year-light);
          color: var(--year-color);
          font-size: 13px;
        }

        .members-table th,
        .members-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          overflow-wrap: anywhere;
        }

        .year-empty {
          padding: 24px 16px;
          border: 1px dashed var(--year-border);
          border-radius: 10px;
          background: var(--year-light);
          color: #475569;
          text-align: center;
        }

        @media (max-width: 650px) {
          .admin-page {
            padding: 18px 12px 40px;
          }

          .admin-header,
          .year-section {
            padding: 18px;
          }

          .year-heading {
            gap: 10px;
            flex-wrap: wrap;
          }

          .year-heading h2 {
            font-size: 19px;
          }

          .year-number {
            width: 44px;
            height: 44px;
            font-size: 18px;
          }

          .year-count {
            min-width: 75px;
            padding: 9px;
          }

          .registration-details {
            grid-template-columns: 1fr;
          }

          .registration-card {
            padding: 13px;
          }
        }
      `}</style>

      <div className="admin-container">
        <header className="admin-header">
          <h1>FRAMEVERSE Admin Dashboard</h1>
          <p>
            Manage event registrations separately for all four
            academic years.
          </p>
        </header>

        {!registrations && (
          <form className="admin-login" onSubmit={login}>
            <h2>Administrator Login</h2>
            <p>Sign in to view team registration details.</p>

            <label htmlFor="admin-username">Admin username</label>
            <input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">Admin password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login to Dashboard"}
            </button>
          </form>
        )}

        <p className="admin-message" role="status">
          {message}
        </p>

        {registrations && (
          <>
            <div className="admin-summary">
              <div>
                <h2>Registration Overview</h2>
                <p>Summary of submitted team registrations.</p>
              </div>

              <div className="admin-total">
                <strong>{totalRegistrations}</strong>
                <span>Total Teams</span>
              </div>
            </div>

            {YEAR_SECTIONS.map((year) => {
              const rows = Array.isArray(
                registrations[year.key]
              )
                ? registrations[year.key]
                : [];

              return (
                <section
                  key={year.key}
                  className="year-section"
                  aria-labelledby={`${year.key}-heading`}
                  style={{
                    "--year-color": year.color,
                    "--year-light": year.light,
                    "--year-border": year.border,
                  }}
                >
                  <div className="year-heading">
                    <div className="year-number">
                      {year.number}
                    </div>

                    <div>
                      <h2 id={`${year.key}-heading`}>
                        {year.label} Registrations
                      </h2>
                      <p>
                        Team details for {year.label.toLowerCase()}
                      </p>
                    </div>

                    <div className="year-count">
                      <strong>{rows.length}</strong>
                      <span>
                        {rows.length === 1
                          ? "TEAM"
                          : "TEAMS"}
                      </span>
                    </div>
                  </div>

                  {rows.length === 0 ? (
                    <div className="year-empty">
                      <strong>No registrations yet</strong>
                      <p>
                        No teams are registered under{" "}
                        {year.label.toLowerCase()}.
                      </p>
                    </div>
                  ) : (
                    rows.map((row) => {
                      const members = parseTeamMembers(
                        row.team_members
                      );

                      return (
                        <article
                          key={row.registration_id}
                          className="registration-card"
                          style={{
                            "--year-color": year.color,
                            "--year-light": year.light,
                          }}
                        >
                          <h3>
                            Registration ID: {row.registration_id}
                          </h3>

                          <div className="registration-details">
                            <div className="detail-item">
                              <span>TEAM LEADER</span>
                              <strong>
                                {row.team_lead_name || "—"}
                              </strong>
                            </div>

                            <div className="detail-item">
                              <span>MOBILE NUMBER</span>
                              <strong>{row.mobile || "—"}</strong>
                            </div>

                            <div className="detail-item">
                              <span>LAPTOP AVAILABILITY</span>
                              <strong>
                                {row.laptop_availability || "—"}
                              </strong>
                            </div>
                          </div>

                          <h4 className="members-title">
                            Team Members
                          </h4>

                          {members.length > 0 ? (
                            <div className="members-table-wrap">
                              <table className="members-table">
                                <thead>
                                  <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">
                                      Register Number
                                    </th>
                                    <th scope="col">Section</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {members.map((member, index) => (
                                    <tr
                                      key={`${
                                        member.registerNumber ||
                                        member.name ||
                                        "member"
                                      }-${index}`}
                                    >
                                      <td>
                                        {member.name || "—"}
                                      </td>
                                      <td>
                                        {member.registerNumber || "—"}
                                      </td>
                                      <td>
                                        {member.section || "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p>Member details are unavailable.</p>
                          )}
                        </article>
                      );
                    })
                  )}
                </section>
              );
            })}
          </>
        )}
      </div>
    </main>
  );
}
