import { createServer } from "node:http";
import { YEAR_CONFIG } from "./src/registrationConfig.js";
import { saveRegistration } from "./registrationStore.mjs";

const HOST = process.env.API_HOST ?? "127.0.0.1";
const PORT = Number(process.env.API_PORT ?? 3001);
const MAX_BODY_BYTES = 32 * 1024;

function jsonResponse(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function normalizeName(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLocaleLowerCase() : "";
}

function isPlausibleMobile(value) {
  if (typeof value !== "string" || !/^\+?[\d\s().-]+$/.test(value.trim())) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && !/^([0-9])\1+$/.test(digits);
}

export function validateRegistration(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, status: 400, message: "Registration details must be submitted as an object." };
  }

  const year = YEAR_CONFIG[payload.academic_year];
  if (!year) {
    return { valid: false, status: 422, message: "Choose a valid academic year.", field: "academic_year" };
  }

  const requiredFields = [
    ["teamLeadName", "Team Lead Name"],
    ["teamLeadMobile", "Team Lead Mobile Number"],
    ["laptopAvailability", "Laptop Availability"],
  ];
  for (const [field, label] of requiredFields) {
    if (typeof payload[field] !== "string" || !payload[field].trim()) {
      return { valid: false, status: 422, message: `${label} is required.`, field };
    }
  }

  if (!isPlausibleMobile(payload.teamLeadMobile)) {
    return { valid: false, status: 422, message: "Enter a valid mobile number with 7 to 15 digits.", field: "teamLeadMobile" };
  }

  if (payload.laptopAvailability !== "Yes" && payload.laptopAvailability !== "No") {
    return { valid: false, status: 422, message: "Select Yes or No for laptop availability.", field: "laptopAvailability" };
  }

  const submittedMembers = Array.isArray(payload.teamMembers) ? payload.teamMembers : [];
  const members = submittedMembers.map((member) => ({
    name: typeof member?.name === "string" ? member.name.trim().replace(/\s+/g, " ") : "",
    registerNumber: typeof member?.registerNumber === "string" ? member.registerNumber.trim() : "",
    section: typeof member?.section === "string" ? member.section.trim() : "",
  }));

  if (members.length > 3) {
    return { valid: false, status: 422, message: "Registration cannot be submitted: A team can have a maximum of 3 unique members." };
  }

  const submittedNames = members.map((member) => member.name).filter(Boolean);
  const submittedNormalizedNames = submittedNames.map(normalizeName);
  if (new Set(submittedNormalizedNames).size !== submittedNormalizedNames.length) {
    return { valid: false, status: 422, message: "Registration cannot be submitted: Duplicate team member names are not allowed." };
  }
  if (new Set(submittedNormalizedNames).size < 2) {
    return { valid: false, status: 422, message: "Registration cannot be submitted: Please enter at least 2 unique team members." };
  }

  for (const [index, member] of members.entries()) {
    const memberNumber = index + 1;
    if (member.registerNumber && !/^\d+$/.test(member.registerNumber)) {
      return {
        valid: false,
        status: 422,
        message: "Register number must contain digits only.",
        field: `teamMember${memberNumber}RegisterNumber`,
      };
    }
    if (!member.name || !member.registerNumber || !member.section) {
      const missingField = !member.name ? "Name" : !member.registerNumber ? "RegisterNumber" : "Section";
      const label = !member.name ? "Name" : !member.registerNumber ? "Register Number" : "Section";
      return {
        valid: false,
        status: 422,
        message: `Team Member ${memberNumber} — ${label} is required.`,
        field: `teamMember${memberNumber}${missingField}`,
      };
    }
  }

  const normalizedMembers = members.map((member) => normalizeName(member.name));
  const uniqueMembers = new Set(normalizedMembers);
  if (!uniqueMembers.has(normalizeName(payload.teamLeadName))) {
    return { valid: false, status: 422, message: "Registration cannot be submitted: The team lead must be one of the listed team members." };
  }

  return {
    valid: true,
    academic_year: payload.academic_year,
    collection: year.collection,
    registration: {
      academic_year: payload.academic_year,
      teamLeadName: payload.teamLeadName.trim().replace(/\s+/g, " "),
      teamMembers: members,
      teamLeadMobile: payload.teamLeadMobile.trim(),
      laptopAvailability: payload.laptopAvailability,
    },
  };
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must contain valid JSON.");
    error.status = 400;
    throw error;
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/api/registrations") {
    jsonResponse(response, 404, { message: "Not found." });
    return;
  }

  try {
    const result = validateRegistration(await readJsonBody(request));
    if (!result.valid) {
      jsonResponse(response, result.status, { message: result.message, field: result.field });
      return;
    }

    const saved = saveRegistration(result.academic_year, result.registration);
    jsonResponse(response, 201, {
      saved: true,
      registrationId: saved.id,
      academic_year: result.academic_year,
      collection: result.collection,
    });
  } catch (error) {
    const status = error.status ?? 503;
    const message = error.status
      ? error.message
      : "Registration storage is unavailable. Nothing was saved.";
    jsonResponse(response, status, { message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`FRAMEVERSE validation API listening at http://${HOST}:${PORT}`);
});
