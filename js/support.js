/* ==========================================================================
   Toy Haven — support.js
   Feedback and support page: the validated contact form, the stored
   message log and the FAQ accordion.
   ========================================================================== */

/* global TH */

(function () {
  "use strict";

  /* ==================================================================
     1. Feedback form
     ================================================================== */

  const form = document.getElementById("feedback-form");

  const SCHEMA = {
    name: { required: true, minLength: 2, maxLength: 60, pattern: "name", label: "Your name", message: "Enter your name using letters, spaces, apostrophes or hyphens." },
    email: { required: true, pattern: "email", label: "Email address", message: "Enter an email address such as you@example.com." },
    topic: { required: true, label: "Topic", message: "Choose what your message is about." },
    message: { required: true, minLength: 10, maxLength: 600, label: "Message" }
  };

  if (form) {
    const success = document.querySelector("[data-feedback-success]");

    TH.wireLiveValidation(form, SCHEMA);

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!TH.validateForm(form, SCHEMA)) {
        TH.toast("Check the highlighted fields", "A few details still need fixing before we can send this.", "error");
        return;
      }

      const entry = {
        reference: TH.reference("MSG"),
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        topic: form.elements.topic.options[form.elements.topic.selectedIndex].text,
        message: form.elements.message.value.trim(),
        sentAt: new Date().toISOString()
      };

      TH.saveFeedback(entry);

      success.hidden = false;
      success.innerHTML = [
        '<div class="success-panel mt-5" role="status">',
        '  <div class="success-check" aria-hidden="true">',
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 7"/></svg>',
        "  </div>",
        "  <h3>Message received</h3>",
        "  <p>Thank you, " + TH.escapeHtml(entry.name.split(" ")[0]) + ". Your reference is <strong>" + TH.escapeHtml(entry.reference) +
        "</strong> and the support desk replies within one working day.</p>",
        "</div>"
      ].join("\n");

      TH.toast("Message sent", "Reference " + entry.reference + " was saved to this device.", "success");
      form.reset();
      renderLog();
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ==================================================================
     2. Stored message log
     ================================================================== */

  const log = document.querySelector("[data-feedback-log]");

  function renderLog() {
    if (!log) {
      return;
    }
    const messages = TH.getFeedback();
    if (messages.length === 0) {
      log.innerHTML = "";
      return;
    }

    log.innerHTML = [
      "<h3>Messages saved on this device</h3>",
      '<p class="muted"><small>Everything you send from this demonstration form is kept in your browser so you can see exactly what was captured.</small></p>',
      '<div class="table-scroll">',
      '  <table class="table">',
      "    <caption>Your recent messages</caption>",
      "    <thead><tr><th scope=\"col\">Reference</th><th scope=\"col\">Sent</th><th scope=\"col\">Topic</th><th scope=\"col\">Message</th></tr></thead>",
      "    <tbody>",
      messages.map(function (item) {
        const preview = item.message.length > 70 ? item.message.slice(0, 70) + "…" : item.message;
        return "<tr><th scope=\"row\">" + TH.escapeHtml(item.reference) + "</th><td>" + TH.formatDate(item.sentAt) +
          "</td><td>" + TH.escapeHtml(item.topic) + "</td><td>" + TH.escapeHtml(preview) + "</td></tr>";
      }).join("\n"),
      "    </tbody>",
      "  </table>",
      "</div>",
      '<p><button type="button" class="btn btn--quiet btn--small" data-clear-feedback>Clear saved messages</button></p>'
    ].join("\n");

    log.querySelector("[data-clear-feedback]").addEventListener("click", function () {
      TH.write(TH.KEYS.feedback, []);
      renderLog();
      TH.toast("Messages cleared", "No saved messages remain on this device.", "info");
    });
  }

  /* ==================================================================
     3. FAQ accordion
     ================================================================== */

  function initAccordion() {
    const accordion = document.querySelector("[data-accordion]");
    if (!accordion) {
      return;
    }
    const triggers = Array.prototype.slice.call(accordion.querySelectorAll(".accordion__trigger"));

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        const expanded = trigger.getAttribute("aria-expanded") === "true";
        // Only one answer stays open at a time.
        triggers.forEach(function (other) {
          other.setAttribute("aria-expanded", "false");
          document.getElementById(other.getAttribute("aria-controls")).hidden = true;
        });
        if (!expanded) {
          trigger.setAttribute("aria-expanded", "true");
          document.getElementById(trigger.getAttribute("aria-controls")).hidden = false;
        }
      });
    });

    // Up and down arrows move between questions.
    accordion.addEventListener("keydown", function (event) {
      const current = triggers.indexOf(document.activeElement);
      if (current === -1) {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        triggers[(current + 1) % triggers.length].focus();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        triggers[(current - 1 + triggers.length) % triggers.length].focus();
      }
    });

    // Open the first answer when the page is reached from a #faq link.
    if (window.location.hash === "#faq" && triggers.length) {
      triggers[0].click();
    }
  }

  renderLog();
  initAccordion();
}());
