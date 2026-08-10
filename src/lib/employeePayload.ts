import type { EmployeeFormValues } from "@/lib/employeeSchema";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value;
}

function readNumber(formData: FormData, key: string): number {
  const value = formData.get(key);
  if (!value) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export function readEmployeeValuesFromFormData(formData: FormData): EmployeeFormValues {
  return {
    employeeName: readString(formData, "employeeName"),
    mobileNumber: readString(formData, "mobileNumber"),
    alternateNumber: readString(formData, "alternateNumber"),
    email: readString(formData, "email"),
    dob: readString(formData, "dob"),
    maritalStatus: (readString(formData, "maritalStatus") || "Single") as EmployeeFormValues["maritalStatus"],
    bloodGroup: readString(formData, "bloodGroup"),
    offeredSalary: readNumber(formData, "offeredSalary"),
    interviewDate: readString(formData, "interviewDate"),
    joiningDate: readString(formData, "joiningDate"),
    relationType: (readString(formData, "relationType") || "Father") as EmployeeFormValues["relationType"],
    relativeName: readString(formData, "relativeName"),
    designation: readString(formData, "designation"),
    role: (readString(formData, "role") || "Employee") as EmployeeFormValues["role"],
    accessRole: readString(formData, "accessRole") as EmployeeFormValues["accessRole"],
    workingType: (readString(formData, "workingType") || "Full Time") as EmployeeFormValues["workingType"],
    workingMode: (readString(formData, "workingMode") || "Work From Home") as EmployeeFormValues["workingMode"],
    officeLocation: readString(formData, "officeLocation"),
    currentAddress: readString(formData, "currentAddress"),
    permanentAddress: readString(formData, "permanentAddress"),

    accountHolderName: readString(formData, "accountHolderName"),
    accountNumber: readString(formData, "accountNumber"),
    ifscCode: readString(formData, "ifscCode"),
    bankName: readString(formData, "bankName"),
    upiId: readString(formData, "upiId"),
    upiHolderName: readString(formData, "upiHolderName"),
    aadharNumber: readString(formData, "aadharNumber"),
    panNumber: readString(formData, "panNumber"),
    reportingTLId: readString(formData, "reportingTLId"),
    reportingTLName: readString(formData, "reportingTLName"),
    reportingTLEmail: readString(formData, "reportingTLEmail"),
  };
}
