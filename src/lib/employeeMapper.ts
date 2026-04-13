import type { AccessRole, Employee, EmployeeFormRole, WorkingType } from "@/types/employee";

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
  address: {
    currentAddress: string;
    permanentAddress: string;
    workingLocation: string;
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
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function mapEmployee(doc: MongoEmployee): Employee {
  return {
    _id: String(doc._id),
    employeeName: doc.employeeName,
    mobileNumber: doc.mobileNumber,
    alternateNumber: doc.alternateNumber || "",
    email: doc.email,
    designation: doc.designation,
    role: doc.role,
    accessRole: doc.accessRole,
    workingType: doc.workingType,
    address: {
      currentAddress: doc.address.currentAddress,
      permanentAddress: doc.address.permanentAddress,
      workingLocation: doc.address.workingLocation,
    },
    accountDetails: {
      accountHolderName: doc.accountDetails.accountHolderName || "",
      accountNumber: doc.accountDetails.accountNumber,
      ifscCode: doc.accountDetails.ifscCode,
      bankName: doc.accountDetails.bankName,
      upiId: doc.accountDetails.upiId || "",
      upiHolderName: doc.accountDetails.upiHolderName || "",
    },
    documents: {
      aadharNumber: doc.documents.aadharNumber,
      aadharFile: doc.documents.aadharFile,
      panNumber: doc.documents.panNumber || "",
      panCardFile: doc.documents.panCardFile,
      academicDocuments: doc.documents.academicDocuments || [],
      experienceLetter: doc.documents.experienceLetter,
      passportPhoto: doc.documents.passportPhoto,
      passbookFile: doc.documents.passbookFile,
    },
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt),
  };
}
