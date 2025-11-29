"use client";

type RoleSelectorProps = {
  value: "student" | "teacher";
  onChange: (role: "student" | "teacher") => void;
};

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="flex w-full gap-2 rounded-xl bg-gray-100 p-1">
      <button
        type="button"
        onClick={() => onChange("student")}
        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
          value === "student" ? "bg-white shadow border" : "text-gray-600 hover:bg-white"
        }`}
        aria-pressed={value === "student"}
      >
        Alumno
      </button>
      <button
        type="button"
        onClick={() => onChange("teacher")}
        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
          value === "teacher" ? "bg-white shadow border" : "text-gray-600 hover:bg-white"
        }`}
        aria-pressed={value === "teacher"}
      >
        Docente
      </button>
    </div>
  );
}