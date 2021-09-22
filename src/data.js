const columns = (columnDimension, data) => ({
  values: Array.from(new Set(data.map((d) => d[columnDimension]))).sort(),
  label: columnDimension,
});

export const getLevels = (data, rowDimensions) => {
  const level1 = Array.from(new Set(data.map((d) => d[rowDimensions[0]])));
  const level2 = Array.from(new Set(data.map((d) => d[rowDimensions[1]])));
  return [
    { label: rowDimensions[0], values: level1.concat("Grand Total") },
    { label: rowDimensions[1], values: level2 },
  ];
};

export const getColumns = (rowDimensions, columnDimension, data) => [
  ...rowDimensions,
  ...columns(columnDimension, data).values,
  "Grand Total",
];

export const totalSumCell = (data, columnDimension, metric) => {
  const { values, label } = columns(columnDimension, data);
  return values.map((col) =>
    data
      .filter((d) => d[label] === col)
      .reduce((acc, current) => (acc += current[metric]), 0)
  );
};

export const totalCat = (data, rowDimensions, metric) => {
  const { label, values } = getLevels(data, rowDimensions)[0];
  return values.map((c) => ({
    [c]: data
      .filter((d) => d[label] === c)
      .reduce((acc, current) => (acc += current[metric]), 0),
  }));
};

export const getSubTotal = (data, rowDimensions, metric) => {
  const { label, values } = getLevels(data, rowDimensions)[1];
  return values.map((s) => ({
    [s]: data
      .filter((d) => d[label] === s)
      .reduce((acc, current) => (acc += current[metric]), 0),
  }));
};

export const getCellSum = (data, rowDimensions, columnDimension, metric) => {
  const { label, values } = getLevels(data, rowDimensions)[1];
  const { values: cols } = columns(columnDimension, data);
  return values.map((l2) =>
    cols.map((col) => ({
      [columnDimension]: col,
      [l2]: data
        .filter((d) => d[label] === l2 && d[columnDimension] === col)
        .reduce((acc, current) => (acc += current[metric]), 0),
    }))
  );
};

export const getLevelSum = (data, rowDimensions, columnDimension, metric) => {
  const { label: llabel, values: levels } = getLevels(data, rowDimensions)[0];
  const { values: cols, label: clabel } = columns(columnDimension, data);

  return levels.map((c) =>
    cols.map((col) => ({
      [clabel]: col,
      [c]: data
        .filter((d) => d[llabel] === c && d[clabel] === col)
        .reduce((acc, current) => (acc += current[metric]), 0),
    }))
  );
};

export const grandTotalCat = (data, rowDimensions, metric) => {
  const values = totalCat(data, rowDimensions, metric);
  return values.reduce((acc, cur) => {
    const v = Object.keys(cur)[0];
    return (acc += cur[v]);
  }, 0);
};

export const dataLevels = (dataset, rowDimensions, columnDimension, metric) => {
  const mungledData = getData(dataset, rowDimensions, columnDimension, metric);
  const levels = getLevels(dataset, rowDimensions)[0].values;
  const total = totalSumCell(dataset, columnDimension, metric);
  const subTotals = getLevelSum(
    dataset,
    rowDimensions,
    columnDimension,
    metric
  );
  const gTotal = grandTotalCat(dataset, rowDimensions, metric);
  const totalCats = totalCat(dataset, rowDimensions, metric);

  return levels?.map((level, i) =>
    mungledData
      .filter((d) => d.level1 === level)
      .concat({ level1: level, total: subTotals[i].concat(totalCats[i]) })
      .map((d) => {
        if (d.level1 === "Grand Total") {
          d.total = [ ...total, gTotal ];
        }
        return d;
      })
  );
};

/*
 * This function contructs a data structure for the component.
 *
 */
export const getData = (data, rowDimensions, columnDimension, metric) => {
  const levels = getLevels(data, rowDimensions)[1].values;
  const subTotal = getSubTotal(data, rowDimensions, metric);

  const cellSum = getCellSum(data, rowDimensions, columnDimension, metric);

  return levels.map((l, index) => ({
    level1: data.find((d) => d[rowDimensions[1]] === l)[rowDimensions[0]],
    level2: l,
    cellSum: cellSum[index].concat(subTotal[index]),
  }));
};
