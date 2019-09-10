export function filterList<T extends { [key: string]: any }>(
  data: Array<T>,
  filter: string
) {
  const objectKeys = Object.keys(data);

  data.map(obj => ({
    filterText: objectKeys.map(k => obj[k] + "").join(),
    item: obj
  }));
}
