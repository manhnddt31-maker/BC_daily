export function parseNumber(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/%$/u, "").replace(/\s/g, "");

  if (!normalized || normalized.startsWith("#")) {
    return null;
  }

  const commaIndex = normalized.lastIndexOf(",");
  const dotIndex = normalized.lastIndexOf(".");
  let numericValue = normalized;

  if (commaIndex > -1 && dotIndex > -1) {
    numericValue =
      commaIndex > dotIndex
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (commaIndex > -1) {
    numericValue = normalized.replace(",", ".");
  } else if ((normalized.match(/\./g) ?? []).length > 1) {
    numericValue = normalized.replace(/\./g, "");
  }

  const parsed = Number(numericValue);
  return Number.isFinite(parsed) ? parsed : null;
}
