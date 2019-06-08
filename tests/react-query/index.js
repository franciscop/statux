import { create, act } from "react-test-renderer";

import toHtml from "./json-to-html.js";

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

$.prototype.find = function(key) {
  return this.inst.root.findByType(key);
};

$.prototype.html = function(options = {}) {
  return toHtml(this.json(options), options);
};

const toJson = (json, options) => {
  const props = {};
  for (let key in json.props) {
    if (/^on/.test(key)) {
      if (options.events) {
        props[key] = json.props[key];
      }
    } else {
      props[key] = json.props[key];
    }
  }
  json.props = props;
  return json;
};

$.prototype.json = function(options = {}) {
  return toJson(this.inst.toJSON(), options);
};

$.prototype.click = function() {
  let res;
  act(() => {
    res = this.inst.toJSON().props.onClick();
  });
  return res;
};

export default $;
