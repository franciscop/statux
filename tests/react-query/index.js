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

$.prototype.json = function(options = {}) {
  return toJson(this.inst.toJSON(), options);
};

$.prototype.click = function() {
  return act(async () => this.inst.toJSON().props.onClick());
};

export default $;
