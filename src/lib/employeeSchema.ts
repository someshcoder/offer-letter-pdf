import { z } from "zod";
import { ACCESS_ROLES, EMPLOYEE_FORM_ROLES, WORKING_TYPES } from "@/types/employee";

const phoneRegex = /^\d{10}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const aadharRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const employeeSchema = z.object({
  employeeName: z.string().trim().min(2, "Employee name is required"),
  mobileNumber: z
    .string()
    .trim()
    .regex(phoneRegex, "Mobile number must be 10 digits"),
  alternateNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || phoneRegex.test(value), {
      message: "Alternate number must be 10 digits",
    }),
  email: z.email("Valid email is required").trim(),
  designation: z.string().trim().min(2, "Designation is required"),
  role: z.enum(EMPLOYEE_FORM_ROLES),
  accessRole: z.enum(ACCESS_ROLES),
  workingType: z.enum(WORKING_TYPES),
  currentAddress: z.string().trim().min(5, "Current address is required"),
  permanentAddress: z.string().trim().min(5, "Permanent address is required"),
  workingLocation: z.string().trim().min(2, "Working location is required"),
  accountHolderName: z.string().trim().min(2, "Account holder name is required"),
  accountNumber: z.string().trim().min(8, "Account number is required"),
  ifscCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ifscRegex, "Invalid IFSC code"),
  bankName: z.string().trim().min(2, "Bank name is required"),
  upiId: z.string().trim().optional().or(z.literal("")),
  upiHolderName: z.string().trim().optional().or(z.literal("")),
  aadharNumber: z
    .string()
    .trim()
    .regex(aadharRegex, "Aadhar number must be 12 digits"),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || panRegex.test(value), {
      message: "Invalid PAN number (e.g. ABCDE1234F)",
    }),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
