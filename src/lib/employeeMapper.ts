import type { AccessRole, Employee, EmployeeFormRole, WorkingMode, WorkingType } from "@/types/employee";

type MongoEmployee = {
  _id: unknown;
  employeeName: string;
  mobileNumber: string;
  alternateNumber?: string;
  email: string;
  designation: string;
  role: EmployeeFormRole;
  accessRole: AccessRole;
  workingType: WorkingType;
  workingMode: WorkingMode;
  officeLocation?: string;
  dob: string;
  maritalStatus: string;
  bloodGroup?: string;
  offeredSalary?: number;
  interviewDate?: string;
  joiningDate: string;
  relationType: string;
  relativeName: string;
  address: {
    currentAddress: string;
    permanentAddress: string;
  };
  accountDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId?: string;
    upiHolderName?: string;
  };
  documents: {
    aadharNumber: string;
    aadharFile?: Employee["documents"]["aadharFile"];
    panNumber?: string;
    panCardFile?: Employee["documents"]["panCardFile"];
    academicDocuments: Employee["documents"]["academicDocuments"];
    experienceLetter?: Employee["documents"]["experienceLetter"];
    passportPhoto?: Employee["documents"]["passportPhoto"];
    passbookFile?: Employee["documents"]["passbookFile"];
  };
  reportingTL?: {
    id: unknown;
    employeeName: string;
    email: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function mapEmployee(doc: Partial<MongoEmployee> & Pick<MongoEmployee, "_id" | "employeeName" | "email">): Employee {
  return {
    _id: String(doc._id),
    employeeName: doc.employeeName,
    mobileNumber: doc.mobileNumber || "",
    alternateNumber: doc.alternateNumber || "",
    email: doc.email,
    designation: doc.designation || "",
    role: doc.role || "Employee",
    accessRole: doc.accessRole || "Employee",
    workingType: doc.workingType || "Full Time",
    workingMode: doc.workingMode || "Work From Home",
    officeLocation: doc.officeLocation || "",
    dob: doc.dob || "",
    maritalStatus: (doc.maritalStatus as any) || "Single",
    bloodGroup: doc.bloodGroup || "",
    offeredSalary: doc.offeredSalary || 0,
    interviewDate: doc.interviewDate || "",
    joiningDate: doc.joiningDate || "",
    relationType: (doc.relationType as any) || "Father",
    relativeName: doc.relativeName || "",
    address: {
      currentAddress: doc.address?.currentAddress || "",
      permanentAddress: doc.address?.permanentAddress || "",
    },
    accountDetails: {
      accountHolderName: doc.accountDetails?.accountHolderName || "",
      accountNumber: doc.accountDetails?.accountNumber || "",
      ifscCode: doc.accountDetails?.ifscCode || "",
      bankName: doc.accountDetails?.bankName || "",
      upiId: doc.accountDetails?.upiId || "",
      upiHolderName: doc.accountDetails?.upiHolderName || "",
    },
    documents: {
      aadharNumber: doc.documents?.aadharNumber || "",
      aadharFile: doc.documents?.aadharFile,
      panNumber: doc.documents?.panNumber || "",
      panCardFile: doc.documents?.panCardFile,
      academicDocuments: doc.documents?.academicDocuments || [],
      experienceLetter: doc.documents?.experienceLetter,
      passportPhoto: doc.documents?.passportPhoto,
      passbookFile: doc.documents?.passbookFile,
    },
    reportingTL: doc.reportingTL
      ? {
          id: String(doc.reportingTL.id),
          employeeName: doc.reportingTL.employeeName,
          email: doc.reportingTL.email,
        }
      : undefined,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt
          ? String(doc.createdAt)
          : "",
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : doc.updatedAt
          ? String(doc.updatedAt)
          : "",
  };
}
