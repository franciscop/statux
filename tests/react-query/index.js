// In React 16.9 - https://github.com/facebook/react/issues/15379
import { create, act } from "react-test-renderer";

import toHtml from "./json-to-html.js";
import delay from "delay";

const $ = function(obj, options) {
  if (!(this instanceof $)) {
    return new $(obj, options);
  }
  // If it's already rendered
  this.inst = create(obj);
  return this;
};

$.prototype.attr = function(key) {
  return this.inst.toTree().props[key];
};

$.prototype.html = function(options = {}) {
  return toHtml(this.json(options), options);
};

const toJson = (json, options) => {
  const props = {};
  for (let key in json.props) {
    if (!/^on/.test(key)) {
      props[key] = json.props[key];
    }
  }
  json.props = props;
  return json;
};

const dotGet = (obj, sel = "") => {
  if (typeof sel === "function") return sel(obj);
  return sel.split(".").reduce((obj, i) => obj[i], obj);
};

$.prototype.json = function(options = {}) {
  return toJson(this.inst.toJSON(), options);
};

$.prototype.bubble = function(selector) {
  const json = this.inst.toJSON();

  const getChild = (_, i, all) => {
    const childSelector = all.slice(0, all.length - i).join(".");
    return dotGet(json, childSelector);
  };

  // The root one is also a target
  return [...selector.split(".").map(getChild), json].filter(Boolean);
};

$.prototype.click = function(selector = "") {
  return act(async () => {
    for (let target of this.bubble(selector)) {
      if (!target.props) continue;
      if (!target.props.onClick) continue;
      await target.props.onClick({});
    }
    return;
  });
};

export default $;
