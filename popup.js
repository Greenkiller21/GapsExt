const WEBSITE = 'https://gaps.heig-vd.ch';
const URL = WEBSITE + '/consultation/controlescontinus/consultation.php';
const COOKIE_GAPS = {
  domain: 'gaps.heig-vd.ch'
};

let username = '';
let password = '';
var newGradesList = {};

reloadSettings().then(async () => await reloadGapsGrades());

async function reloadSettings() {
  var p = new Promise(function(resolve, reject) {
    chrome.storage.local.get("loginInfos", ({ loginInfos }) => {
      resolve(loginInfos);
    });
  });

  var obj = await p;
  username = obj.usr;
  password = obj.pwd;
}

async function reloadGapsGrades() {
  setStatus("Loading grades ...");
  await removeAllCookies(COOKIE_GAPS);

  let formDataLogin = new FormData();
  formDataLogin.append('login', username);
  formDataLogin.append('password', password);
  formDataLogin.append('submit', 'Enter');

  let gradesCount = 0;

  fetch(URL,
    {
      body: formDataLogin,
      method: 'POST',
      mode: 'no-cors'
    }
  ).then(htmlLogin => {
    htmlLogin.text().then(_ => {
      let formDataGrades = new FormData();
      formDataGrades.append('rs', 'smartReplacePart');
      formDataGrades.append('rsargs', '["result", "result", null, null, null, null]');

      fetch(URL, 
        {
          body: formDataGrades,
          method: 'POST',
          mode: 'no-cors'
        }
      ).then(async html => {
        let text = await html.text();
        text = text.substring(7, text.length - 5); //+:"@££@ (at the start) et @££@" (at the end)
        text = text.replaceAll('\\/', '/');
        text = text.replaceAll('\\"', '"');
        text = unicodeToChar(text);

        var table = getHtmlFromText(text);
        table = table.getElementsByClassName('displayArray')[0];

        newGradesList = getGrades(table);
        var grades = await getGradesNotSeen(newGradesList);

        setStatus();
        showGrades(grades);
        gradesCount = Object.keys(grades).length;
      });
    }).catch(error => setStatus('Error fetching grades : ' + error));
  }).catch(error => setStatus('Error logging in : ' + error));

  return gradesCount;
}

function removeAllCookies(cookieType) {
  var promise = chrome.cookies.getAll(
    cookieType
  )
  promise.then(cookies => {
    for (var i = 0; i < cookies.length; i++) {
      chrome.cookies.remove({
        name: cookies[i].name,
        url: WEBSITE + cookies[i].path
      });
    }
  });
  return promise;
}

function getGrades(table) {
  var rows = table.rows;

  var grades = {};

  var course = undefined;
  var course_part = undefined;
  var test = undefined;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row.cells[0].classList.value == 'bigheader') {
      course = row.cells[0].textContent.split(' - ')[0];
      continue;
    }
    if (row.cells[0].classList.value == "odd" || row.cells[0].classList.value == "edge") {
      course_part = row.cells[0].innerHTML.split('<br>')[0];
      continue;
    }
    if (course && course_part) {
      test = {
        date: row.cells[0].textContent,
        name: row.cells[1].textContent,
        //moyenneClasse: row.cells[2].textContent,
        coef: row.cells[3].textContent,
        mark: row.cells[4].textContent
      }
    }

    if (!grades[[course, course_part]]) {
      grades[[course, course_part]] = [];
    }
    grades[[course, course_part]].push(test);
  }

  return grades;
}

async function getGradesNotSeen(newCourses) {
  var p = new Promise(function(resolve, reject) {
    var gradesNotSeen = {};
    chrome.storage.sync.get("grades", ({ grades }) => {
      if (grades === undefined) {
        grades = {};
      }
      for (newCourse in newCourses) {
        var newGrades = newCourses[newCourse];
        newGrades.forEach(newGrade => {
          if (!grades[newCourse] || !contains(grades[newCourse], newGrade)) {
            if (newGrade.mark != '-') {
              if (!gradesNotSeen[newCourse]) {
                gradesNotSeen[newCourse] = [];
              }
              gradesNotSeen[newCourse].push(newGrade);
            }
          }
        });
      }
      resolve(gradesNotSeen);
    });
  });

  return p;
}

function contains(tab, def) {
  var mustReturn = false;
  tab.forEach(ele => {
    if (deepCompare(ele, def)){
      mustReturn = true;
      return;
    }
  });
  return mustReturn;
}

function getHtmlFromText(text) {
  var el = document.createElement('div');
  el.innerHTML = text;
  return el.firstElementChild;
}

function setStatus(text) {
  var statusDiv = document.getElementById('statusDiv');
  statusDiv.style.display = text ? "block" : "none";
  statusDiv.innerHTML = text;
}

function showGrades(grades) {
  document.getElementById('dataDiv').firstChild?.remove();

  if (Object.entries(grades).length == 0) {
    setStatus("No grades...");
    return;
  }

  var table = document.createElement('table');
  for (var course in grades) {
    var th = document.createElement('th');
    th.innerText = course;
    table.appendChild(th);
    grades[course].forEach(grade => {
      var tr = document.createElement('tr');
      for (var info in grade) {
        var td = document.createElement('td');
        td.innerText = grade[info];
        tr.appendChild(td);
      }
      var td = document.createElement('td');
      var i = document.createElement('input');
      i.type = 'button';
      var courseCopy = course;
      i.onclick = async function() {
        await setAsSeen(courseCopy, grade);
        var grades = await getGradesNotSeen(newGradesList);
        showGrades(grades);
      };
      td.appendChild(i);
      tr.appendChild(td);

      table.appendChild(tr);
    });
  }
  document.getElementById('dataDiv').appendChild(table);
}

async function setAsSeen(course, grade) {
  var p = new Promise(function(resolve, reject) {
    chrome.storage.sync.get("grades", ({ grades }) => {
      if (grades === undefined) {
        grades = {};
      }
      if (!grades[course]) {
        grades[course] = [];
      }
      grades[course].push(grade);
      chrome.storage.sync.set({ grades });
      resolve();
    });
  });

  await p;
}

function unicodeToChar(text) {
  return text.replace(/\\u[\dA-F]{4}/gi, 
  function (match) {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

///
/// Utils
///

function deepCompare() {
  var i, l, leftChain, rightChain;

  function compare2Objects(x, y) {
    var p;

    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
      return true;
    }

    // Compare primitives and functions.     
    // Check if both arguments link to the same object.
    // Especially useful on the step where we compare prototypes
    if (x === y) {
      return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if ((typeof x === 'function' && typeof y === 'function') ||
       (x instanceof Date && y instanceof Date) ||
       (x instanceof RegExp && y instanceof RegExp) ||
       (x instanceof String && y instanceof String) ||
       (x instanceof Number && y instanceof Number)) {
      return x.toString() === y.toString();
    }

    // At last checking prototypes as good as we can
    if (!(x instanceof Object && y instanceof Object)) {
      return false;
    }

    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
      return false;
    }

    if (x.constructor !== y.constructor) {
      return false;
    }

    if (x.prototype !== y.prototype) {
      return false;
    }

    // Check for infinitive linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
      return false;
    }

    // Quick checking of one object being a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for (p in y) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      }
      else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
    }

    for (p in x) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      }
      else if (typeof y[p] !== typeof x[p]) {
        return false;
      }

      switch (typeof (x[p])) {
        case 'object':
        case 'function':
          leftChain.push(x);
          rightChain.push(y);

          if (!compare2Objects (x[p], y[p])) {
            return false;
          }

          leftChain.pop();
          rightChain.pop();
          break;

        default:
          if (x[p] !== y[p]) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  if (arguments.length < 1) {
    return true; //Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more arguments to compare";
  }

  for (i = 1, l = arguments.length; i < l; i++) {
    leftChain = []; //Todo: this can be cached
    rightChain = [];

    if (!compare2Objects(arguments[0], arguments[i])) {
      return false;
    }
  }

  return true;
}

///
/// DEV ONLY
///

function bglog(obj) {
  if(chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}