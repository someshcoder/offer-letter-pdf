export interface SalaryStructure {
  monthlySalary: number;
  totalDays: number;
  unpaidLeaves: number;
  paidLeaves: number;
  bonus: number;
  overtime: number;
  taxPercentage: number;
  otherDeductions: number;
}

export interface SalaryBreakdown {
  perDaySalary: number;
  workedDays: number;
  grossEarned: number;
  totalBonus: number;
  pfDeduction: number;
  taxDeduction: number;
  totalDeduction: number;
  netSalary: number;
}

export const calculateSalary = (data: SalaryStructure): SalaryBreakdown => {
  const {
    monthlySalary,
    totalDays,
    unpaidLeaves,
    bonus,
    overtime,
    taxPercentage,
    otherDeductions,
  } = data;

  // 1. Basic Per Day calculation
  const perDaySalary = monthlySalary / totalDays;

  // 2. Worked Days (Total - Unpaid)
  const workedDays = Math.max(0, totalDays - unpaidLeaves);

  // 3. Gross Earned (Based on worked days)
  const grossEarned = perDaySalary * workedDays;

  // 4. Bonus/Overtime
  const totalBonus = (bonus || 0) + (overtime || 0);

  // 5. Deductions
  // PF is usually 12% of basic (assuming monthly salary is the base for PF calculation here)
  const pfDeduction = monthlySalary * 0.12;
  const taxDeduction = grossEarned * (taxPercentage / 100);
  const totalDeduction = pfDeduction + taxDeduction + (otherDeductions || 0);

  // 6. Final Net Salary
  const netSalary = Math.max(0, grossEarned + totalBonus - totalDeduction);

  return {
    perDaySalary: Number(perDaySalary.toFixed(2)),
    workedDays,
    grossEarned: Number(grossEarned.toFixed(2)),
    totalBonus,
    pfDeduction: Number(pfDeduction.toFixed(2)),
    taxDeduction: Number(taxDeduction.toFixed(2)),
    totalDeduction: Number(totalDeduction.toFixed(2)),
    netSalary: Number(netSalary.toFixed(2)),
  };
};
