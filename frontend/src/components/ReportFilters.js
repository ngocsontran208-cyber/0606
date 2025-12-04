import React, { useState } from "react";
import { Input } from "@/components/ui/input";

const ReportFilters = () => {
  const [course, setCourse] = useState("");
  const [major, setMajor] = useState("");

  return (
    <div className="flex gap-4 mb-4">
      <Input
        type="text"
        placeholder="🔎 Tìm theo môn học..."
        value={course}
        onChange={(e) => setCourse(e.target.value)}
      />
      <Input
        type="text"
        placeholder="🔎 Tìm theo ngành học..."
        value={major}
        onChange={(e) => setMajor(e.target.value)}
      />
    </div>
  );
};

export default ReportFilters;