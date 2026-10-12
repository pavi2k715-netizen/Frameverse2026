import Admin from "./Admin";
import { useState } from "react";
import "./App.css";
import { YEAR_CONFIG } from "./registrationConfig.js";

const eventRules = [
  "Participation is open to students as specified by the event organizers.",
  "The poster must be based on the given theme.",
  "Posters must be created digitally using tools such as Canva, Adobe Photoshop, or other design software.",
  "Each participant or team must submit one original poster through the online mode.",
  "Plagiarism and direct copying of existing posters are strictly prohibited.",
  "The poster must be clear, informative, creative, and visually appealing.",
  "Participants must submit their posters within the allotted time.",
  "The use of AI tools, templates, and online resources must follow the guidelines announced by the organizers.",
  "The judges' decision will be final.",
  "Participants must follow the instructions provided by the event coordinators.",
];

const EMPTY_FORM = {
  teamLeadName: "",
  teamMember1Name: "",
  teamMember1RegisterNumber: "",
  teamMember1Section: "",
  teamMember2Name: "",
  teamMember2RegisterNumber: "",
  teamMember2Section: "",
  teamMember3Name: "",
  teamMember3RegisterNumber: "",
  teamMember3Section: "",
  teamLeadMobile: "",
  laptopAvailability: "",
};

const MEMBER_FIELDS = [
  { name: "teamMember1", label: "Team Member 1", required: true },
  { name: "teamMember2", label: "Team Member 2", required: true },
  { name: "teamMember3", label: "Team Member 3", required: false },
];

const MEMBER_DETAILS = [
  { suffix: "Name", label: "Name" },
  { suffix: "RegisterNumber", label: "Register Number", digitsOnly: true },
  { suffix: "Section", label: "Section" },
];

function validateMobileNumber(value) {
  const normalized = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(normalized)) return false;

  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && !/^([0-9])\1+$/.test(digits);
}

function App() {
    if (window.location.pathname === "/admin") {
    return <Admin />;
  }
  const [page, setPage] = useState("home");
  const [selectedYearKey, setSelectedYearKey] = useState("");
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formAlert, setFormAlert] = useState("");
  const [successfulRegistration, setSuccessfulRegistration] = useState(null);
  const selectedYear = YEAR_CONFIG[selectedYearKey];
  const [teamLeadEmail, setTeamLeadEmail] = useState("");

  function chooseYear(yearKey) {
    if (!YEAR_CONFIG[yearKey]) return;
    setSelectedYearKey(yearKey);
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setFormAlert("");
    setPage("registration");
  }

  function openYearSelection() {
    setPage("teams");
  }

  function updateFormField(field, value) {
    setFormValues((currentValues) => ({ ...currentValues, [field]: value }));
    setFormErrors((currentErrors) => {
      const isRegisterNumber = field.endsWith("RegisterNumber");
      if (!currentErrors[field] && !isRegisterNumber) return currentErrors;
      const nextErrors = { ...currentErrors };
      if (isRegisterNumber && value && !/^\d+$/.test(value)) {
        nextErrors[field] = "Register number must contain digits only.";
      } else {
        delete nextErrors[field];
      }
      return nextErrors;
    });
    setFormAlert("");
  }

  async function handleRegistrationSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!formValues.teamLeadName.trim()) {
      nextErrors.teamLeadName = "Team Lead Name is required.";
    }
    if (!validateMobileNumber(formValues.teamLeadMobile)) {
      nextErrors.teamLeadMobile = "Enter a valid mobile number with 7 to 15 digits.";
    }
    if (!formValues.laptopAvailability) {
      nextErrors.laptopAvailability = "Select Yes or No for laptop availability.";
    }
    MEMBER_FIELDS.forEach(({ name: member }) => {
      const field = `${member}RegisterNumber`;
      const value = formValues[field].trim();
      if (value && !/^\d+$/.test(value)) nextErrors[field] = "Register number must contain digits only.";
    });

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormAlert("");
      return;
    }

    const memberNames = MEMBER_FIELDS.map(({ name }) => formValues[`${name}Name`])
      .map((member) => member.trim().replace(/\s+/g, " "))
      .filter(Boolean);
    const normalizedMembers = memberNames.map((member) => member.toLocaleLowerCase());
    const uniqueMembers = new Set(normalizedMembers);

    if (uniqueMembers.size !== normalizedMembers.length) {
      setFormAlert("Registration cannot be submitted: Duplicate team member names are not allowed.");
      return;
    }
    if (uniqueMembers.size < 2) {
      setFormAlert("Registration cannot be submitted: Please enter at least 2 unique team members.");
      return;
    }
    if (uniqueMembers.size > 3) {
      setFormAlert("Registration cannot be submitted: A team can have a maximum of 3 unique members.");
      return;
    }
    if (!uniqueMembers.has(formValues.teamLeadName.trim().replace(/\s+/g, " ").toLocaleLowerCase())) {
      setFormAlert("Registration cannot be submitted: The team lead must be one of the listed team members.");
      return;
    }

    MEMBER_FIELDS.forEach(({ name: member, label, required }) => {
      MEMBER_DETAILS.forEach(({ suffix, label: detailLabel }) => {
        const field = `${member}${suffix}`;
        const value = formValues[field].trim();
        if (required && !value) nextErrors[field] = `${label} — ${detailLabel} is required.`;
      });
    });

    const thirdMemberFields = MEMBER_DETAILS.map(({ suffix }) => `teamMember3${suffix}`);
    if (thirdMemberFields.some((field) => formValues[field].trim())) {
      MEMBER_DETAILS.forEach(({ suffix, label }) => {
        const field = `teamMember3${suffix}`;
        if (!formValues[field].trim()) {
          nextErrors[field] = `Team Member 3 — ${label} is required when any third-member detail is provided.`;
        }
      });
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormAlert("");
      return;
    }

    setFormAlert("");
    const registrationPayload = {
      academic_year: selectedYearKey,
      teamLeadName: formValues.teamLeadName,
      teamMembers: MEMBER_FIELDS.map(({ name }) => ({
        name: formValues[`${name}Name`],
        registerNumber: formValues[`${name}RegisterNumber`],
        section: formValues[`${name}Section`],
      })).filter((member) => member.name.trim() || member.registerNumber.trim() || member.section.trim()),
      teamLeadMobile: formValues.teamLeadMobile,
      laptopAvailability: formValues.laptopAvailability,
    };

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload),
      });
      const result = await response.json();

      if (response.status === 422 && result.field && Object.hasOwn(formValues, result.field)) {
        setFormErrors({ [result.field]: result.message });
        setFormAlert("");
        return;
      }
      if (!response.ok) {
        setFormAlert(result.message || "Registration could not be processed. Nothing was saved.");
        return;
      }
      if (result.saved !== true || !result.registrationId) {
        setFormAlert("The server did not confirm that your registration was saved. Please try again.");
        return;
      }

      setSuccessfulRegistration({
        year: selectedYear,
        registrationId: result.registrationId,
      });
      setPage("success");
    } catch {
      setFormAlert("Registration could not reach the server. Nothing was saved; please try again later.");
    }
  }

  return (
    <main className={`app${page !== "home" ? " event-app" : ""}`}>
      <nav className="navbar">
        <div className="brand">
          FRAME<span>VERSE</span>
          <div className="brand-line" />
        </div>

        <div className="nav-label">
          CREATIVE EVENT · 2026
        </div>
        <button
  className="nav-button"
  onClick={() => {
    window.location.href = "/admin";
  }}
>
  Admin ↗
</button>

        <button
          className="nav-button"
          onClick={() => {
            if (page === "home") setPage("event");
            else if (page === "teams") setPage("event");
            else if (page === "registration") openYearSelection();
            else if (page === "success") setPage("home");
            else setPage("home");
          }}
        >
          {page === "home"
            ? "Explore Event ↗"
            : page === "teams"
              ? "← Back to Theme"
              : page === "registration"
                ? "← Year Selection"
                : page === "success"
                  ? "← Back to Home"
                : "← Back to Home"}
        </button>
      </nav>

      {page === "home" && (
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">
              A SPACE FOR CREATIVE MINDS
            </p>

            <h1>
              FRAME
              <br />
              <span>VERSE.</span>
            </h1>

            <p className="hero-description">
              Think beyond the frame.
              <br />
              Create something unforgettable.
            </p>

            <button
              className="primary-button"
              onClick={() => setPage("event")}
            >
              Discover the Event <span>↗</span>
            </button>

            <div className="hero-meta">
              <span>IDEAS</span>
              <span className="meta-dot">•</span>
              <span>DESIGN</span>
              <span className="meta-dot">•</span>
              <span>CREATIVITY</span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-plate" />
            <div className="art-tilted-frame" />
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-ring" />
            <div className="art-disc" />
            <div className="art-sphere" />
            <div className="art-technical" />
            <div className="art-frame">
              <div className="art-number">FV.</div>
              <div className="art-caption">
                YOUR VISION.
                <br />
                YOUR FRAME.
              </div>
              <div className="art-cross">+</div>
            </div>
            
          </div>

          <div className="hero-footer">
            <span>CREATIVITY HAS NO LIMITS.</span>
            <span>SCROLL YOUR IMAGINATION ↘</span>
          </div>
        </section>
      )}

      {page === "event" && (
        <section className="event-page">
          <div className="event-hero">
            <div className="event-hero-copy">
              <p className="event-kicker"><span>FRAMEVERSE · POSTER THEME</span></p>
              <h1 className="event-title">
                DIGITAL
                <br />
                STANDARDS
                <br />
                <span>FOR A</span>
                <br />
                <em>SUSTAINABLE</em>
                <br />
                <em>FUTURE.</em>
              </h1>
              <div className="event-theme-line">
                <span className="theme-rule" />
                <p>SDG 7 — AFFORDABLE<br />AND CLEAN ENERGY</p>
              </div>
              <p className="bis-note">A creative invitation to explore BIS — the Bureau of Indian Standards — through the lens of sustainable energy.</p>
            </div>

            <div className="energy-art" aria-hidden="true">
              <div className="energy-art-identity">
                <div className="sdg-art-number"><span>SDG</span><strong>07</strong></div>
                <p>AFFORDABLE<br />AND CLEAN ENERGY</p>
              </div>
              <div className="energy-sun" />
              <div className="energy-orbit energy-orbit-one" />
              <div className="energy-orbit energy-orbit-two" />
              <div className="solar-plane solar-plane-back" />
              <div className="solar-plane solar-plane-front" />
              <div className="wind-turbine turbine-left"><i /><b /><span /></div>
              <div className="wind-turbine turbine-right"><i /><b /><span /></div>
              <div className="energy-horizon" />
              <div className="energy-landscape landscape-back" />
              <div className="energy-landscape landscape-front" />
              <div className="energy-art-foot"><span>QUALITY · SAFETY · TRUST</span><span>FRAMEVERSE / 2026</span></div>
            </div>
            <div className="event-hero-index"><span>THEME BRIEF</span><span>SCROLL TO EXPLORE ↓</span></div>
          </div>

          <section className="theme-explainer" aria-labelledby="theme-heading">
            <div className="section-heading">THE IDEA</div>
            <div className="explainer-title-wrap">
              <h2 id="theme-heading">Make standards<br /><span>visible.</span></h2>
              <p className="explainer-lead">Good energy changes the world.<br />Good standards help it work.</p>
            </div>
            <div className="explainer-copy">
              <p>Digital creativity can turn complex ideas into clear, compelling stories. Use your poster to show how standards support clean-energy products that are safe, reliable, and built to perform.</p>
              <p>Interpret <strong>“Digital Standards for a Sustainable Future”</strong> through SDG 7. Make the connection between quality, trust, and a cleaner energy future easy to see.</p>
              <div className="explainer-stamp"><span>SDG</span><strong>07</strong><small>AFFORDABLE<br />AND CLEAN ENERGY</small></div>
            </div>
          </section>

          <section className="feature-section" aria-label="Theme pillars">
            <div className="feature-heading"><div className="section-heading">THE ENERGY PILLARS</div><p>One connected<br />energy future.</p></div>
            <div className="feature-strip">
              <article className="feature-card feature-clean">
                <div className="feature-topline"><span>SOURCE</span><span className="feature-glyph glyph-sun" /></div>
                <div className="feature-visual clean-visual"><i /><b /><span /></div>
                <h3>CLEAN<br />ENERGY</h3>
                <p>Solar, wind, and other renewable energy—designed for people and planet.</p>
              </article>
              <article className="feature-card feature-trust">
                <div className="feature-topline"><span>ASSURANCE</span><span className="feature-glyph glyph-mark">✓</span></div>
                <div className="feature-visual trust-visual"><i /><b /><span /></div>
                <h3>TRUSTED<br />STANDARDS</h3>
                <p>Quality, safety, and reliability that help clean-energy solutions earn trust.</p>
              </article>
              <article className="feature-card feature-future">
                <div className="feature-topline"><span>IMPACT</span><span className="feature-glyph glyph-horizon">↗</span></div>
                <div className="feature-visual future-visual"><i /><b /><span /></div>
                <h3>SUSTAINABLE<br />FUTURE</h3>
                <p>Responsible energy use for a cleaner, more resilient world.</p>
              </article>
            </div>
          </section>

          <section className="rules-section" aria-labelledby="rules-heading">
            <div className="rules-intro">
              <div className="section-heading">RULES &amp; REGULATIONS</div>
              <h2 id="rules-heading">The fine<br /><span>print.</span></h2>
              <p>Ten points to keep your entry original, thoughtful, and on brief.</p>
              <div className="rules-seal"><span>FV</span><small>MAKE IT<br />MATTER</small></div>
            </div>
            <ol className="rules-list">
              {eventRules.map((rule, index) => (
                <li key={rule}>
                  <span className="rule-number">{String(index + 1).padStart(2, "0")}</span>
                  <p>{rule}</p>
                  <span className="rule-arrow">↗</span>
                </li>
              ))}
            </ol>
          </section>

          <footer className="event-footer">
            <span>FRAMEVERSE <i>×</i> SDG 07</span>
            <span>IDEAS FOR A BETTER ENERGY FUTURE.</span>
            <button className="continue-button" onClick={openYearSelection}>
              Choose Your Year <span aria-hidden="true">↗</span>
            </button>
          </footer>
        </section>
      )}

      {page === "teams" && (
        <section className="year-page event-page" aria-labelledby="year-heading">
          <div className="year-page-heading">
            <p className="section-heading">FRAMEVERSE · YEAR SELECTION</p>
            <h1 id="year-heading">Choose Your Year to Register</h1>
            <p>Choose your academic year to begin registration.</p>
          </div>

          <div className="year-options" aria-label="Select academic year">
            {Object.entries(YEAR_CONFIG).map(([yearKey, year], index) => (
              <button
                className="year-option"
                key={yearKey}
                onClick={() => chooseYear(yearKey)}
              >
                <span className="year-option-index">0{index + 1} / YEAR</span>
                <span className="year-option-title">{year.label}</span>
                <span className="year-option-action">Register Now <b aria-hidden="true">→</b></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {page === "registration" && selectedYear && (
        <section className="registration-page event-page" aria-labelledby="registration-heading">
          <div className="registration-heading">
            <p className="section-heading">FRAMEVERSE · TEAM REGISTRATION</p>
            <p className="registration-year-label">{selectedYear.label}</p>
            <h1 id="registration-heading">{selectedYear.label.toUpperCase()}<br /><span>REGISTRATION.</span></h1>
            <p className="registration-intro">Add the team details below to continue.</p>
          </div>

          <form className="registration-form" noValidate onSubmit={handleRegistrationSubmit}>
            <div className="form-field">
              <label htmlFor="teamLeadName">Team Lead Name <span aria-hidden="true">*</span></label>
              <input id="teamLeadName" name="teamLeadName" type="text" value={formValues.teamLeadName} onChange={(event) => updateFormField("teamLeadName", event.target.value)} required aria-invalid={Boolean(formErrors.teamLeadName)} aria-describedby={formErrors.teamLeadName ? "teamLeadName-error" : undefined} />
              {formErrors.teamLeadName && <span className="field-error" id="teamLeadName-error">{formErrors.teamLeadName}</span>}
            </div>
            


<div className="form-field">
  <label htmlFor="teamLeadEmail">
    Team Lead Email *
  </label>
  <input
    id="teamLeadEmail"
    type="email"
    name="teamLeadEmail"
    placeholder="Enter team lead email"
    value={formValues.teamLeadEmail}
    onChange={(e) =>
      updateFormField("teamLeadEmail", e.target.value)
    }
    required
  />
</div>








            <div className="team-members-heading">
              <h2>Team Members</h2>
              <p>(Minimum 2 members, maximum 3)</p>
            </div>

            {MEMBER_FIELDS.map(({ name: member, label, required }) => (
              <fieldset className="member-details-fieldset" key={member}>
                <legend>{label}{!required && <span> (Optional)</span>}</legend>
                {MEMBER_DETAILS.map(({ suffix, label: detailLabel, digitsOnly }) => {
                  const field = `${member}${suffix}`;
                  const optional = !required;
                  const fieldLabel = `${label} — ${detailLabel}${optional ? " (Optional)" : ""}`;
                  return (
                    <div className="form-field" key={field}>
                      <label htmlFor={field}>{fieldLabel}{!optional && <span aria-hidden="true"> *</span>}</label>
                      <input
                        id={field}
                        name={field}
                        type="text"
                        inputMode={digitsOnly ? "numeric" : undefined}
                        autoComplete={digitsOnly ? "off" : undefined}
                        value={formValues[field]}
                        onChange={(event) => updateFormField(field, event.target.value)}
                        required={!optional}
                        aria-invalid={Boolean(formErrors[field])}
                        aria-describedby={formErrors[field] ? `${field}-error` : undefined}
                      />
                      {formErrors[field] && <span className="field-error" id={`${field}-error`}>{formErrors[field]}</span>}
                    </div>
                  );
                })}
              </fieldset>
            ))}

            <div className="form-field">
              <label htmlFor="teamLeadMobile">Team Lead Mobile Number <span aria-hidden="true">*</span></label>
              <input id="teamLeadMobile" name="teamLeadMobile" type="tel" inputMode="tel" autoComplete="tel" value={formValues.teamLeadMobile} onChange={(event) => updateFormField("teamLeadMobile", event.target.value)} required aria-invalid={Boolean(formErrors.teamLeadMobile)} aria-describedby={formErrors.teamLeadMobile ? "teamLeadMobile-error" : "mobile-help"} />
              <span className="field-hint" id="mobile-help">Include your country code if needed.</span>
              {formErrors.teamLeadMobile && <span className="field-error" id="teamLeadMobile-error">{formErrors.teamLeadMobile}</span>}
            </div>

            <fieldset className="laptop-fieldset">
              <legend>Laptop Availability <span aria-hidden="true">*</span></legend>
              <div className="radio-options">
                {["Yes", "No"].map((answer) => (
                  <label className={`radio-option${formValues.laptopAvailability === answer ? " is-checked" : ""}`} key={answer}>
                    <input type="radio" name="laptopAvailability" value={answer} checked={formValues.laptopAvailability === answer} onChange={() => updateFormField("laptopAvailability", answer)} required aria-invalid={Boolean(formErrors.laptopAvailability)} aria-describedby={formErrors.laptopAvailability ? "laptopAvailability-error" : undefined} />
                    <span>{answer}</span>
                  </label>
                ))}
              </div>
              {formErrors.laptopAvailability && <span className="field-error" id="laptopAvailability-error">{formErrors.laptopAvailability}</span>}
            </fieldset>

            <button className="submit-registration-button" type="submit">Submit Registration <span aria-hidden="true">↗</span></button>
            {formAlert && <div className="registration-alert" role="alert">{formAlert}</div>}
          </form>
        </section>
      )}

      {page === "success" && successfulRegistration && (
        <section className="registration-success event-page" aria-labelledby="success-heading">
          <p className="section-heading">FRAMEVERSE · REGISTRATION CONFIRMATION</p>
          <div className="success-mark" aria-hidden="true"><span>✓</span></div>
          <h1 id="success-heading">REGISTRATION<br /><span>SUCCESSFUL!</span></h1>
          <div className="success-copy">
            <p>Congratulations! Your team has successfully registered for FRAMEVERSE.</p>
            <p>Thank you for being part of this exciting event. Get ready to share your ideas, showcase your creativity, and make your mark!</p>
            <p>We wish your team the very best!</p>
          </div>
          <p className="success-year">Selected academic year · <strong>{successfulRegistration.year.label}</strong></p>
          <p className="success-reference">Registration reference · {successfulRegistration.registrationId}</p>
          <button className="success-home-button" onClick={() => setPage("home")}>Back to Home <span aria-hidden="true">↗</span></button>
        </section>
      )}

    </main>
  );
}

export default App;
