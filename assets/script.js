const $ = u;

// Remove an incorrect "get" that there was highlighted
Prism.hooks.add("after-highlight", function (env) {
  u("span.token.keyword").each((el) => {
    if (el.innerHTML === "get") {
      if (el.nextElementSibling && el.nextElementSibling.innerHTML === "(") {
        u(el).replace('<span class="token function">get</span>');
      } else {
        u(el).replace("get");
      }
    }
    if (el.innerHTML === "delete") {
      if (
        el.previousElementSibling &&
        el.previousElementSibling.innerHTML === "."
      ) {
        u(el).replace("delete");
      }
    }
    if (el.innerHTML === "public") u(el).replace("public");
  });
});

// Automatically build the Table of Contents if the aside has the class "auto"
if (u("aside").hasClass("auto")) {
  const menus = [];
  u("article h2, article h3").each((el) => {
    const to = "#" + el.id;
    const title = u("<div />").text(u(el).text()).html();
    if (u(el).is("h2")) {
      menus.push({ to, title, sections: [] });
    } else {
      if (menus[menus.length - 1]) {
        menus[menus.length - 1].sections.push({ to, title });
      } else {
        console.warn(`Need a h2 above the h3 ${title}`);
      }
    }
  });

  const ButtonMore = `
    <button class="more">
      <img src="/assets/plus.svg">
    </button>
  `;

  const Submenu = ({ to, title }) => `
    <div>
      <a href="${to}">
        <img src="/assets/file.svg" />
        ${title}
      </a>
    </div>
  `;

  const Section = ({ to, title, sections }) => `
    <section>
      <h3>
        ${sections.length ? ButtonMore : ""}
        <a href="${to}">
          ${sections.length ? "" : '<img src="/assets/file.svg">'}
          ${title}
        </a>
      </h3>
      ${
        sections.length
          ? `
        <div class="submenu">
          ${sections.map(Submenu).join("")}
        </div>
      `
          : ""
      }
    </section>
  `;

  u(".scroller").append(menus.map(Section).join(""));
}

const showSection = (section, forceTrue) => {
  if (!section.is) section = $(section);
  if (!section.is("section")) section = section.closest("section");
  const isActive = section.hasClass("active");
  if (isActive && forceTrue) return;
  section.toggleClass("active", !isActive);
  const menu = section.find(".submenu").first();
  const height = isActive ? 0 : menu.scrollHeight;
  if (menu) {
    menu.style.maxHeight = height + "px";
  }
  section
    .find("h3 img")
    .attr("src", `/assets/${isActive ? "plus" : "minus"}.svg`);
};

if (window.innerWidth > 600) {
  setTimeout(() => {
    const href = window.location.hash || window.location.pathname;
    const target = u(`a[href="${href}"]`);
    const section = target.closest("section").find(".more").first();
    // If the URL+Hash indicates we are in a specific place, highlight that
    if (section) {
      showSection(section);
      // Otherwise open the first section
    } else {
      showSection($(".more").first());
    }
  }, 600);
}

$(".more").on("click", (e) => {
  showSection(e.currentTarget);
});

$("aside a").on("click", (e) => {
  const more = $(e.currentTarget).siblings(".more").first();
  if (!more) return;
  showSection(more, true);
});

// Go to the appropriate part of the page when clicking an internal link
// Manual event delegation
u("a").on("click", (e) => {
  const href = u(e.currentTarget).attr("href");
  if (!href) return;
  const [url, hash] = href.split("#");

  // If it is the current URL just go to the top
  if (url === window.location.pathname && !hash) {
    e.preventDefault();
    u("body").scroll();
    history.replaceState(null, null, window.location.pathname);
    return;
  }

  // If it is an internal link go to that part
  if ((!url || url === window.location.pathname) && u("#" + hash).length) {
    e.preventDefault();
    u("#" + hash).scroll();
    history.replaceState(null, null, "#" + hash);
  }
});

// Search
const searchData = (async () => {
  const unique = (value, index, self) => self.indexOf(value) === index;

  const links = $("aside a")
    .nodes.map((link) => $(link).attr("href"))
    .map((url) => url.split("#").shift())
    .map((url) => url.replace(/\/$/, ""))
    .map((url) => url + "/")
    .filter(unique);

  const stringToHTML = function (str) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(str, "text/html");
    return doc.body.querySelector("article");
  };

  const headings = {};
  const all = {};
  const content = {};
  const articles = await Promise.all(
    links.map((link) =>
      fetch(link)
        .then((res) => res.text())
        .then(stringToHTML)
        .then((art) => {
          $(art)
            .find("h1, h2, h3, h4")
            .each((el) => {
              if (el.nodeName === "H1") {
                headings[`${link}`] = u(el).text().trim();
              } else {
                headings[`${link}#${el.id}`] = u(el).text().trim();
              }
            });

          let last;
          $(art)
            .children()
            .each((el) => {
              if (/H\d/.test(el.nodeName)) {
                if (el.nodeName === "H1") {
                  last = `${link}`;
                } else {
                  last = `${link}#${el.id}`;
                }
                content[last] = "";
              }

              content[last] += $(el).text().trim() + "\n";
            });

          all[link] = $(art).text().toLowerCase().trim();
        })
    )
  );

  return { headings, content, all };
})();

function escape(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Search focus
(async () => {
  if (!$(".search").length) return;

  $(".resuls").html("Loading...");
  const { headings, content } = await searchData;

  window.addEventListener("keydown", (e) => {
    if (e.target.nodeName === "INPUT") {
      if (e.key === "Escape") {
        e.target.blur();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        let index = null;
        $(".results a")
          .each((link, i, links) => {
            if ($(link).hasClass("active")) {
              index = (i + 1) % links.length;
            }
          })
          .removeClass("active")
          .each((link, i) => {
            if (i === index) {
              $(link).addClass("active");
            }
          });
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        let index = null;
        $(".results a")
          .each((link, i, links) => {
            if ($(link).hasClass("active")) {
              index = (links.length + i - 1) % links.length;
            }
          })
          .removeClass("active")
          .each((link, i) => {
            if (i === index) {
              $(link).addClass("active");
            }
          });
      }
      return;
    }
    if (e.key === "/") {
      e.preventDefault();
      $("aside input").first().focus();
    }
  });

  $(".search").on("submit", (e) => {
    e.preventDefault();
    const link = $(".results a").first();
    if (link) {
      link.click();
    }
  });

  $(".search input").on("input", (e) => {
    const text = e.target.value.toLowerCase().replace(/\W/g, " ");
    $(".results").html("");
    $(e.target).closest("form").toggleClass("active", !!text);
    if (!text) return;

    const found = [];
    for (let link in headings) {
      if (!headings[link].toLowerCase().replace(/\W/g, " ").includes(text)) {
        continue;
      }
      if (found.length >= 5) continue;
      found.push(link);
      u(".results").append(`
        <div>
          <a href="${link}">
            <img src="/assets/hash.svg"><span>${headings[link]}</span>
          </a>
        </div>
      `);
    }

    for (let link in content) {
      if (content[link].toLowerCase().replace(/\W/g, " ").includes(text)) {
        if (found.includes(link)) continue;
        if (found.length >= 5) continue;
        found.push(link);
        const header = content[link].split("\n").shift();
        const index = content[link]
          .toLowerCase()
          .replace(/\W/g, " ")
          .indexOf(text);
        const from = Math.max(index - 5, 0);
        const to = from + text.length + 15;
        const match = [
          escape(content[link].slice(from, from + 5)),
          escape(content[link].slice(from + 5, from + 5 + text.length)),
          escape(content[link].slice(from + 5 + text.length, to)),
        ];
        found.push(link);
        u(".results").append(`
          <div>
            <a href="${link}">
              <div>
                <img src="/assets/paragraph.svg"><span>${header}</span>
                <div class="partial">...${match[0]}<strong>${match[1]}</strong>${match[2]}...</div>
              </div>
            </a>
          </div>
        `);
      }
    }

    $(".results > *:first-child a").addClass("active");
  });
})();
