const scrollTarget = "#page-body";

function onDocumentReadyGeneral(){
  // See if there is a system already selected as soon as the page loads
  updateSsmToolbarOpacity();

  // This is a function from spacewalk-checkall.js
  create_checkall_checkbox();

  // Wrapping the tables in a div which will make them responsive
  jQuery(".table").wrap("<div class='table-responsive'>");

  // Set up the behavior and the event function
  // for the spacewalk section toolbar [sst]
  handleSst();

  // Show character length for textarea
  addTextareaLengthNotification();
}

let isReady = false;
/* Getting the screen size to create a fixed padding-bottom in the Section tag to make both columns the same size */
// On window load and resize
jQuery(window).on("load resize", () => {
  isReady = true;
  alignContentDimensions();
});

// Ensure legacy layouts update their sizes when global notifications are added/removed
var isListening = false;
function listenForGlobalNotificationChanges() {
  if (isListening) return;

  var globalNotificationsContainer = document.querySelector("#messages-container");
  if (!globalNotificationsContainer) {
    return;
  }
  isListening = true;

  var observer = new MutationObserver(alignContentDimensions);
  observer.observe(globalNotificationsContainer, {subtree: true, childList: true});
}

// A container function for what should be fired
// to set HTML tag dimensions
function alignContentDimensions() {
  if (!isReady) {
    return;
  }

  navbarToggleMobile();
}

var sstScrollBehaviorSetupIsDone = false; // flag to implement the function one time only
function sstScrollBehaviorSetup(sst) {
  if (sstScrollBehaviorSetupIsDone) {
    return;
  }
  sstScrollBehaviorSetupIsDone = true;

  const element = sst.get(0);
  if (!element) {
    return;
  }

  // See https://css-tricks.com/how-to-detect-when-a-sticky-element-gets-pinned/
  const observer = new IntersectionObserver(
    ([e]) => e.target.classList.toggle("is-sticky", e.intersectionRatio < 1),
    { threshold: [1] }
  );

  observer.observe(element);
}

// when the page scrolls down and the toolbar is going up and hidden,
// the toolbar takes a fixed place right below the header bar
function handleSst() {
  // Some pages may have multiple instances of this element
  var sst = jQuery('.spacewalk-section-toolbar').first();

  if (jQuery('.move-to-fixed-toolbar').length > 0) {
    // if there is no 'spacewalk-section-toolbar', then create it
    if (sst.length == 0) {
      sst = jQuery('<div class="spacewalk-section-toolbar">');
      jQuery('.spacewalk-list.list').before(sst);
    }

    // move each named tag into the 'spacewalk-section-toolbar'
    jQuery('.move-to-fixed-toolbar').each(function() {
      sst.append(jQuery(this));
      jQuery(this).removeClass('move-to-fixed-toolbar');
    });
  }

  // move children of each named tag
  // into the 'spacewalk-section-toolbar > action-button-wrapper'
  if (jQuery('.move-children-to-fixed-toolbar').length > 0) {
    // if there is no 'spacewalk-section-toolbar', then create it
    if (sst.length == 0) {
      sst = jQuery('<div class="spacewalk-section-toolbar">');
      jQuery('.spacewalk-list.list').before(sst);
    }
    var selectorButtonWrapper = jQuery('.selector-button-wrapper');
    // if there is no 'action-button-wrapper', then create it
    if (selectorButtonWrapper.length == 0) {
      selectorButtonWrapper = jQuery('<div class="selector-button-wrapper">');
      sst.prepend(selectorButtonWrapper);
    }
    jQuery('.move-children-to-fixed-toolbar').each(function() {
      selectorButtonWrapper.append(jQuery(this).children());
      jQuery(this).removeClass('move-children-to-fixed-toolbar');
    });
  }

  sstScrollBehaviorSetup(sst);
}

function navbarToggleMobile() {
  if (window.matchMedia("(max-width: 768px)").matches) {
    jQuery('#spacewalk-aside').removeClass('show');
  }
};

// returns an object that can be passed to ajax renderer as a callback
// puts rendered HTML in #divId, opens an alert with the same text if
// debug is true
function makeRendererHandler(divId, debug) {
  return makeAjaxHandler(function(text) {
    if (debug) {
      alert(text);
    }
    jQuery('#' + divId).html(text);
    jQuery('#' + divId).fadeIn();
  });
}

// returns an object that can be passed to ajax calls as a callback
// callbackFunction: function to call when AJAX requests succeeds
// errorHandlerFunction: function to call when AJAX requests fail
// (can be omitted for showFatalError)
// works around a DWR bug calling errorHandler when navigating away
// from a page during an AJAX request
function makeAjaxHandler(callbackFunction, errorHandlerFunction) {
    errorHandlerFunction = typeof errorHandlerFunction !== "undefined" ?
      errorHandlerFunction : showFatalError;

    // workaround to a DWR bug that calls errorHandler when user
    // navigates away from page during an AJAX call
    // first, we detect page unloading
    jQuery(window).on("beforeunload", function() {
      jQuery.unloading = true;
    });
    return {
      callback: callbackFunction,
      errorHandler: function(message, exception) {
        // second, if we get an error during unloading we ignore it
        if (jQuery.unloading == true) {
          console.log("Ignoring exception " + exception + " with message " + message + " because it is a DWR error during unload");
        }
        else {
          errorHandlerFunction(message, exception);
        }
      }
    }
}

// shows a fatal AJAX error
function showFatalError(message, exception) {
  console.log("AJAX call failed with message: " + message);
  console.log(exception);
  var message = "Unexpected error, please reload the page and check server logs.";
  if (window.showErrorToastr) {
    window.showErrorToastr(message, { containerId: "global" });
  } else {
    alert(message);
  }
}

/**
 * Escapes special HTML characters in a string.
 * @param {string} original - The string that may contain special HTML characters.
 * @returns {string} - A new string with special HTML characters replaced with their entities.
 */
function escapeHtml(original) {
  return original
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

// Extension to Twitter Bootstrap.
// Gives you a col-XX-auto class like Bootstrap
// That dynamically adjust the grid for the columns to take
// as much space as possible while still being responsive
// So three col-md-auto would get col-md-4 each.
// Five col-md-auto would get two with col-md-3 and three with col-md-2
function onDocumentReadyAutoBootstrapGrid() {
  jQuery.each(['xs', 'sm', 'md', 'lg'], function(idx, gridSize) {
    //for each div with class row
    jQuery('.col-' + gridSize + '-auto:first').parent().each(function() {
      //we count the number of childrens with class col-md-6
      var numberOfCols = jQuery(this).children('.col-'  + gridSize + '-auto').length;
      if (numberOfCols > 0 && numberOfCols < 13) {
        minSpan = Math.floor(12 / numberOfCols);
        remainder = (12 % numberOfCols);
        jQuery(this).children('.col-' + gridSize + '-auto').each(function(idx, col) {
          var width = minSpan;
          if (remainder > 0) {
            width += 1;
            remainder--;
          }
          jQuery(this).addClass('col-' + gridSize + '-' + width);
        });
      }
    });
  });
}

/**
 * Setups ACE editor in a textarea element
 * textarea is a jQuery object
 * mode is the language mode, if emmpty
 * shows a select box to choose it.
 */
function setupTextareaEditor(textarea, mode) {
  // if textarea is not shown, the height will be negative,
  // so we set the height of the editor in the popup to the 70% of the window height
  var tH = textarea.height() > 0 ? textarea.height() : (jQuery(window).height()  * 0.7);

  var editDiv = jQuery('<div>', {
      position: 'absolute',
      width: textarea.width(),
      height: tH,
      'class': textarea.attr('class')
  }).attr('id', textarea.attr('id') + '-editor').insertBefore(textarea);

  var toolBar = jQuery('<div></div>').insertBefore(editDiv[0]);
  textarea.hide();

  var editor = ace.edit(editDiv[0]);
  editor.getSession().setValue(textarea.val());
  editor.getSession().setOptions({ tabSize: 4, useSoftTabs: true });

  editor.setTheme("ace/theme/xcode");
  editor.getSession().setMode("ace/mode/sh");

  // before submitting the code, the textarea
  // should be updated with the editor value
  textarea.closest('form').submit(function () {
      textarea.val(editor.getSession().getValue());
  })

  toolBar.addClass('ace_editor');
  toolBar.css('width', editDiv.css('width'));
  var modeSel = jQuery('<select> \
    <option selected value="sh">Shell</option> \
    <option value="xml">XML</option> \
    <option value="ruby">Ruby</option> \
    <option value="python">Python</option> \
    <option value="perl">perl</option> \
    <option value="yaml">Yaml</option> \
    </select>');
  modeSel.find('option').each(function() {
  if (jQuery(this).text() == mode)
    jQuery(this).attr('selected', 'selected');
  });

  toolBar.append(modeSel);
  if (mode != "") {
    editor.getSession().setMode("ace/mode/" + mode);
    toolBar.hide();
  }

  modeSel.change(function () {
    editor.getSession().setMode("ace/mode/" + jQuery(this).val());
  });

  // Set editor to read only according to data attribute
  editor.setReadOnly(textarea.data('readonly') || textarea.attr('readonly'));

  editor.getSession().on('change', function() {
    textarea.val(editor.getSession().getValue());
  });
}

/**
 * setups every textarea with data-editor attribute
 * set to some language with an ACE editor
 */
jQuery(function () {
  jQuery('textarea[data-editor]').each(function () {
    var textarea = jQuery(this);
    var mode = textarea.data('editor');
    setupTextareaEditor(textarea, mode);
  });
});

// Disables the enter key from submitting the form
function disableEnterKey() {
  jQuery(window).on('keydown', function(event){
    if(event.keyCode == 13) {
      event.preventDefault();
      return false;
    }
  });
}

// Binds the enter key to a specific submit button on a key event
function enterKeyHandler(event, $button) {
    if(event.keyCode == 13) {
        $button.trigger("click");
        return false;
    }
}

function adjustSpacewalkContent() {
  alignContentDimensions();
  // trigger the 'spacewalk-section-toolbar' (sst) handler on content change
  // since it can happen that the sst has just been added right now
  handleSst();
}

/*
* Create an Observer object that monitors if something in the HTML has changes,
* if that happens it fires the window resize computation event
* https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
*/
// create an observer instance
var spacewalkContentObserver = new MutationObserver(function(mutations) {
    if (mutations.length > 0) {
      adjustSpacewalkContent();
    }
});

function registerSpacewalkContentObservers() {
  var target = document.getElementById('spacewalk-content');
  // configuration of the observer:
  var config = { childList: true, characterData: true, subtree: true };
  // pass in the target node, as well as the observer options
  spacewalkContentObserver.observe(target, config);
}

jQuery(document).on('click', '.toggle-box', function() {
  if (jQuery(this).hasClass('open')) {
    jQuery(this).removeClass('open');
  }
  else {
    jQuery('.toggle-box.open').trigger('click');
    jQuery(this).addClass('open');
  }
  jQuery(this).blur(); // remove the focus
})

// focus go away from the menu or the nav menu
jQuery(document).on("click", function (e) {
  var target = jQuery(e.target);
  // if a toggle-box button is active and the current click
  // is not on its related box, trigger a close for it
  jQuery('.toggle-box.open').each(function() {
    var toggleButton = jQuery(this);
    var toggleBox = toggleButton.parent();
    if (!target.closest(toggleBox).length) {
      toggleButton.trigger('click');
    }
  });
});

/* prevent jumping to the top of the page because
of an <a href> tag that is actually not a link */
jQuery(document).on('click', 'a', function(e) {
  const href = jQuery(this).attr('href');
  if (href != null && href.length == 1 && href == '#') {
    e.preventDefault();
    jQuery(this).blur(); // remove the focus
  }
});

/*
* Check if the field contains the allowed values only
*/
jQuery(document).on('keyup change', '.activationKey-check', function(e) {
  if (jQuery(this).val().match(/([^a-zA-Z0-9-_.])/g)) {
    jQuery(this).parent().addClass('has-error');
  }
  else {
    jQuery(this).parent().removeClass('has-error');
  }
});

function addTextareaLengthNotification() {
  // Add a notification text of the remaining length for a textarea
  jQuery('textarea.with-maxlength').each(function() {
    const textareaId = jQuery(this).attr('id');
    jQuery(this).after(
      jQuery('<div/>')
        .attr("id", "newDiv1")
        .addClass("remaining-length-wrapper text-right")
        .html(
          jQuery('<span/>')
            .html([
              jQuery('<span/>')
              .attr("id", textareaId + '-remaining-length')
              .text(jQuery(this).attr('maxlength') - jQuery(this).val().length)
              , jQuery('<span/>').text(' ' + t('remaining'))
            ])
        )
    );
  });

  // Update the remaining length text of the related textarea
  jQuery(document).on('input', 'textarea.with-maxlength', function() {
    jQuery('#' + jQuery(this).attr('id') + '-remaining-length')
      .html(jQuery(this).attr('maxlength') - jQuery(this).val().length);
  });
}

function initIEWarningUse() {
  if(window.document.documentMode) {
    const bodyContentNode = document.getElementById("spacewalk-content");
    if(bodyContentNode) {
      let ieWarningNode = document.createElement("div");
      ieWarningNode.className = 'alert alert-warning';
      ieWarningNode.innerHTML = t(
          "The browser Internet Explorer is not supported. " +
          "Try using Firefox, Chrome or Edge"
      );

      bodyContentNode.insertBefore(
          ieWarningNode,
          bodyContentNode.firstChild
      )
    }
  }
}

// Function used to initialize old JS behaviour. (After react load/spa transition)
// Please, don't add anything else to this file. The idea is to get rid of this file while migrating everything to react.
function onDocumentReadyInitOldJS() {
  sstScrollBehaviorSetupIsDone = false;
  onDocumentReadyGeneral();
  onDocumentReadyAutoBootstrapGrid();
  initIEWarningUse();
  listenForGlobalNotificationChanges();
}

jQuery(document).ready(function() {
  onDocumentReadyGeneral();
  onDocumentReadyAutoBootstrapGrid();
  registerSpacewalkContentObservers();
  initIEWarningUse();
  listenForGlobalNotificationChanges();
});
