export const courses = ["SF1546", "DD1310", "SG1133", "SF1626", "SF1624", "SA1007"] as const;

export function isCourseCode(value: string): value is (typeof courses)[number] {
  return courses.includes(value as (typeof courses)[number]);
}
