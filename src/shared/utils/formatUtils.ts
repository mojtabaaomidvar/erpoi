// src/shared/utils/formatUtils.ts

export const formatArrayField = (value: any): string => {
  if (!value) return "—";

  let arr: any[] = [];

  if (Array.isArray(value)) {
    arr = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) arr = parsed;
      else arr = [value];
    } catch {
      arr = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (arr.length === 0) return "—";

  const cleaned = arr.map((item) => {
    if (typeof item === "string" && item.startsWith("Others: ")) {
      return item.replace("Others: ", "");
    }
    return item;
  });

  return cleaned.join(", ");
};

export const formatArrayWithLimit = (
  value: any,
  limit: number = 2,
  separator: string = ", ",
): string => {
  if (!value) return "—";

  let arr: any[] = [];

  if (Array.isArray(value)) {
    arr = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) arr = parsed;
      else arr = [value];
    } catch {
      arr = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (arr.length === 0) return "—";
  if (arr.length <= limit) return arr.join(separator);

  const visible = arr.slice(0, limit);
  const remaining = arr.length - limit;

  return `${visible.join(separator)} +${remaining}`;
};

export const sortSpecialties = (specialties: string[]): string[] => {
  if (!specialties || specialties.length === 0) return [];

  const others = specialties.filter((s) => s.startsWith("Others:"));
  const mws = specialties.filter((s) => s === "MWS");
  const standard = specialties.filter(
    (s) => s !== "MWS" && !s.startsWith("Others:"),
  );

  standard.sort((a, b) => a.localeCompare(b));

  return [...standard, ...mws, ...others];
};

export const processOtherValue = (value: string) => {
  if (!value) return { displayValue: "", isOther: false };

  const otherPrefix = "Others:";

  if (value.startsWith(otherPrefix)) {
    return {
      displayValue: value.substring(otherPrefix.length).trim(),
      isOther: true,
    };
  }

  return { displayValue: value, isOther: false };
};
