const toAttr = (props, opts) => {
  const str = Object.entries(props)
    .reduce((props, [key, name]) => {
      if (/^on/.test(key)) {
        if (opts.events) {
          return `${props} ${key}`;
        } else {
          return props;
        }
      }
      return `${props} ${key}=${name}`;
    }, "")
    .trim();
  if (str) return ` ${str}`;
  return "";
};

const toHtml = (obj, opts) => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) return obj.map(toHtml).join("");
  const { type, props = {}, children } = obj;
  return `<${type}${toAttr(props, opts)}>${toHtml(children)}</${type}>`;
};

export default toHtml;
