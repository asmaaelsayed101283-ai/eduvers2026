/* =================================================================
   EDUVERSE — LOGIN PAGE SCRIPT (login.html only)
   Handles the Student/Teacher role toggle, the avatar picker, and
   the student sign-in form. Teacher sign-in itself still happens on
   teacher-dashboard.html (its own dedicated login form) — this page
   just hands teachers off there.
   ================================================================= */

let selectedAvatar = "🧑‍🚀";

function setupRoleToggle() {
  const buttons = document.querySelectorAll(".auth-role-toggle__btn");
  const studentPanel = document.getElementById("studentLoginPanel");
  const teacherPanel = document.getElementById("teacherLoginPanel");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      const isTeacher = btn.dataset.role === "teacher";
      studentPanel.hidden = isTeacher;
      teacherPanel.hidden = !isTeacher;
    });
  });
}

function setupAvatarPicker() {
  const options = document.querySelectorAll(".auth-avatar-picker__opt");
  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      options.forEach((o) => o.classList.remove("is-active"));
      opt.classList.add("is-active");
      selectedAvatar = opt.dataset.avatar;
    });
  });
}

function setupGradeSelect() {
  const select = document.getElementById("studentGradeInput");
  if (!select || typeof buildGradeOptionsHtml !== "function") return;
  select.innerHTML = buildGradeOptionsHtml("grade5");
}

function setupStudentForm() {
  const form = document.getElementById("studentLoginForm");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("studentNameInput").value.trim();
    const gradeId = document.getElementById("studentGradeInput").value;
    const grade = typeof getGradeLabel === "function" ? getGradeLabel(gradeId) : gradeId;
    if (!name) return;

    if (typeof updateStudentProfile === "function") {
      updateStudentProfile({ name, grade, gradeId, avatar: selectedAvatar });
    }
    if (typeof Auth !== "undefined") {
      Auth.login("student", { name, grade, gradeId, avatar: selectedAvatar });
    }
    window.location.href = "learning-worlds.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupRoleToggle();
  setupAvatarPicker();
  setupGradeSelect();
  setupStudentForm();
});
