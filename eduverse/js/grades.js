/* =================================================================
   EDUVERSE — GRADE LEVELS (single source of truth)
   Loaded as a plain classic script wherever a grade selector is
   needed (login.html, teacher-dashboard.html). Every dropdown that
   lists grades should build its options from GRADE_LEVELS instead of
   hardcoding <option> tags, so the supported grades only ever need
   to change in this one file.
   ================================================================= */

const GRADE_LEVELS = [
  { id: "grade4", label: "الصف الرابع الابتدائي", stage: "primary", stageLabel: "المرحلة الابتدائية" },
  { id: "grade5", label: "الصف الخامس الابتدائي", stage: "primary", stageLabel: "المرحلة الابتدائية" },
  { id: "grade6", label: "الصف السادس الابتدائي", stage: "primary", stageLabel: "المرحلة الابتدائية" },
  { id: "grade7", label: "الصف الأول الإعدادي", stage: "preparatory", stageLabel: "المرحلة الإعدادية" },
  { id: "grade8", label: "الصف الثاني الإعدادي", stage: "preparatory", stageLabel: "المرحلة الإعدادية" },
  { id: "grade9", label: "الصف الثالث الإعدادي", stage: "preparatory", stageLabel: "المرحلة الإعدادية" },
];

function getGradeLevels() {
  return GRADE_LEVELS;
}

/** Builds grouped <optgroup> HTML for a <select>, from GRADE_LEVELS.
 *  `selectedId` (a GRADE_LEVELS id, or a legacy free-text label) marks
 *  one option as selected; an "all grades" option is included when
 *  includeAll is true (used where a subject/lesson can target every
 *  grade rather than one specific grade). */
function buildGradeOptionsHtml(selectedId, includeAll = false) {
  const stages = [
    { id: "primary", label: "المرحلة الابتدائية" },
    { id: "preparatory", label: "المرحلة الإعدادية" },
  ];

  const allOption = includeAll
    ? `<option value="all" ${!selectedId || selectedId === "all" ? "selected" : ""}>كل الصفوف</option>`
    : "";

  const groups = stages
    .map((stage) => {
      const options = GRADE_LEVELS.filter((g) => g.stage === stage.id)
        .map((g) => {
          const isSelected = selectedId === g.id || selectedId === g.label;
          return `<option value="${g.id}" ${isSelected ? "selected" : ""}>${g.label}</option>`;
        })
        .join("");
      return `<optgroup label="${stage.label}">${options}</optgroup>`;
    })
    .join("");

  return allOption + groups;
}

/** Looks up a grade's display label from its id — falls back to
 *  returning the input unchanged if it's already a label (older
 *  saved profiles stored the Arabic label directly). */
function getGradeLabel(gradeId) {
  const match = GRADE_LEVELS.find((g) => g.id === gradeId);
  return match ? match.label : gradeId;
}
