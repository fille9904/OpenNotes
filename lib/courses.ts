export type Course = { code: string; name?: string; year: 1 | 2; driveFolderId: string };

export const courses = [
  { code: "KD1000", year: 1, driveFolderId: "1AaFJPsFiKKCRQXaAh7SngX8okNQgmoUE" },
  { code: "SG1133", year: 1, driveFolderId: "1D3_Jal8BRE5Rfno-O_9FkaoZGWa9l13e" },
  { code: "DD1310", year: 1, driveFolderId: "1Mxi1RphFE1783yXNMV7VwiXdNqEo7eTp" },
  { code: "SF1546", year: 1, driveFolderId: "103nmgHVebtZ5UYnhUDqo6KMNoPnzpqA5" },
  { code: "SF1626", year: 1, driveFolderId: "126fGw46XFgkJmFMN2sUyIOkgk2eRaqZB" },
  { code: "SF1624", year: 1, driveFolderId: "1505ebmLt-WkUYMyFE8blzBlKDnKOHsj1" },
  { code: "SA1007", year: 1, driveFolderId: "1aE85-ozXlPRM4lQWJzZ8YzCYUBmBO6pC" },
  { code: "SK1115", year: 1, driveFolderId: "1TH87wLBOTVYD1ZQI_HqyYFDYXl3PnTPF" },
  { code: "SF1625", year: 1, driveFolderId: "17sCLsKz44CTXkqF9Yj9tmRYhXnjyIDWk" },
  { code: "SF0003", year: 1, driveFolderId: "18xvuScb0CzzHrX8VQ1EiuZ7m8fmWYLnK" },
  { code: "SF1683", name: "Differential Equations and Transforms", year: 2, driveFolderId: "1IloQMK0iYL3LzkcV1CnY_o7bldsYP8dw" },
  { code: "SG1113", year: 2, driveFolderId: "12IiBs0MQGwvTfCMKSrnUt_rRyHA84KAq" },
  { code: "SI1146", year: 2, driveFolderId: "1euIlkW4h8fbfCWI60gOpA8YYuNmoFu2t" },
] satisfies Course[];

export function getCourse(code: string, year?: number) {
  return courses.find((course) => course.code === code && (year === undefined || course.year === year));
}
