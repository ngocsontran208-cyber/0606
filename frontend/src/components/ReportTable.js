import React from "react";
import { Table } from "@/components/ui/table";

const ReportTable = ({ data }) => {
  return (
    <Table className="w-full mt-4">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên tài liệu</th>
          <th>Tác giả</th>
          <th>Môn học</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td>{item.id}</td>
            <td>{item.title}</td>
            <td>{item.author}</td>
            <td>{item.course ? item.course.name : "Không xác định"}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ReportTable;
