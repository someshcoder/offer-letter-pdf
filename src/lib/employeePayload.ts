import type { EmployeeFormValues } from "@/lib/employeeSchema";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value;
}

export function readEmployeeValuesFromFormData(formData: FormData): EmployeeFormValues {
  return {
    employeeName: readString(formData, "employeeName"),
    mobileNumber: readString(formData, "mobileNumber"),
    alternateNumber: readString(formData, "alternateNumber"),
    email: readString(formData, "email"),
    designation: readString(formData, "designation"),
    role: (readString(formData, "role") || "Employee") as EmployeeFormValues["role"],
    accessRole: readString(formData, "accessRole") as EmployeeFormValues["accessRole"],
    workingType: (readString(formData, "workingType") || "Full Time") as EmployeeFormValues["workingType"],
    currentAddress: readString(formData, "currentAddress"),
    permanentAddress: readString(formData, "permanentAddress"),
    workingLocation: readString(formData, "workingLocation"),
    accountHolderName: readString(formData, "accountHolderName"),
    accountNumber: readString(formData, "accountNumber"),
    ifscCode: readString(formData, "ifscCode"),
    bankName: readString(formData, "bankName"),
    upiId: readString(formData, "upiId"),
    upiHolderName: readString(formData, "upiHolderName"),
    aadharNumber: readString(formData, "aadharNumber"),
    panNumber: readString(formData, "panNumber"),
  };
}
