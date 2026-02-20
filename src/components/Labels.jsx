"use client";

import {
  Button,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { useCallback, useMemo, useState } from "react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";

export default ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / 20);
  const onPageChange = useCallback((n) => {
    setCurrentPage(n);
    console.log(n);
  });
  const [sort, setSort] = useState("Name");
  const [sortAsc, setSortAsc] = useState(true);
  const sortCallback = useCallback(
    (col) => () => {
      if (sort !== col) {
        setSort(col);
      } else {
        setSortAsc(!sortAsc);
      }
    },
    [setSort, setSortAsc, sortAsc, sort],
  );
  const sortedData = useMemo(
    () =>
      data
        .sort((A, B) => {
          const a = A[sort.toLowerCase()];
          const b = B[sort.toLowerCase()];
          return sortAsc
            ? a > b
              ? 1
              : a < b
                ? -1
                : 0
            : a > b
              ? -1
              : a < b
                ? 1
                : 0;
        })
        .slice((currentPage - 1) * 20, (currentPage - 1) * 20 + 20),
    [sort, data, sortAsc, currentPage],
  );
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHead>
          <TableRow>
            {["Name", "Handle", "Manual_Entry"].map((d) => (
              <TableHeadCell key={d}>
                <Button onClick={sortCallback(d)}>
                  {d === sort ? (
                    sortAsc ? (
                      <HiChevronUp />
                    ) : (
                      <HiChevronDown />
                    )
                  ) : (
                    ""
                  )}
                  {d}
                </Button>
              </TableHeadCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((d) => (
            <TableRow key={d.handle}>
              <TableCell>{d.name}</TableCell>
              <TableCell>{d.handle}</TableCell>
              <TableCell>{d.manual_entry}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex overflow-x-auto sm:justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
