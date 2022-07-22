const VERSION = 1.0;
const WEBSITE = 'https://gaps.heig-vd.ch';
const URL = WEBSITE + '/consultation/controlescontinus/consultation.php';
const COOKIE_GAPS = {
  domain: 'gaps.heig-vd.ch'
};

let username = '';
let password = '';
var newGradesList = {};

config();

async function config() {
  await checkVersion();
  await reloadSettings();
  await reloadGapsGrades();
}

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
    chrome.storage.local.get("grades", ({ grades }) => {
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
  var hashedGrade = hashGrade(def);
  tab.forEach(ele => {
    if (ele === hashedGrade){
      mustReturn = true;
      return;
    }
  });
  return mustReturn;
}

function hashGrade(grade) {
  return hashString(JSON.stringify(grade));
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

function gradesLength(grades) {
  var length = 0;
  var courses = Object.entries(grades);
  courses.forEach(course => {
    for (var grade in course[1]) {
      length++;
    }
  });
  return length;
}

function showGrades(grades) {
  document.getElementById('dataDiv').childNodes.forEach(node => node.remove());
  document.getElementById('optionsDiv').childNodes.forEach(node => node.remove());

  if (gradesLength(grades) == 0) {
    setStatus("No grades...");
    return;
  }

  if (gradesLength(grades) >= 5) {
    var divContainer = document.createElement('div');
    var text = document.createElement('p');
    text.textContent = "Mark all as seen";
    text.style.verticalAlign = "middle";
    text.style.display = "inline-block";
    text.style.marginRight = "10px";

    var markAllAsSeenBtn = document.createElement('input');
    markAllAsSeenBtn.type = 'button';
    markAllAsSeenBtn.style.verticalAlign = "middle";

    markAllAsSeenBtn.onclick = async function() {
      var gradesButtons = document.getElementById('dataDiv').getElementsByClassName('gradeClass');

      for (let index = 0; index < gradesButtons.length; index++) {
        var gradesButton = gradesButtons.item(index);
        await gradesButton.setasseen();
      }

      var gradesToShow = await getGradesNotSeen(newGradesList);
      showGrades(gradesToShow);
    };

    divContainer.appendChild(text);
    divContainer.appendChild(markAllAsSeenBtn);
    
    document.getElementById('optionsDiv').appendChild(divContainer);
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
      i.className = 'gradeClass';
      var courseCopy = course;
      i.setasseen = async function() {
        await setAsSeen(courseCopy, grade);
      };
      i.onclick = async function() {
        await i.setasseen();
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
    chrome.storage.local.get("grades", ({ grades }) => {
      if (grades === undefined) {
        grades = {};
      }
      if (!grades[course]) {
        grades[course] = [];
      }
      grades[course].push(hashGrade(grade));
      chrome.storage.local.set({ grades });
      resolve();
    });
  });

  return p;
}

async function checkVersion() {
  var p = new Promise(function(resolve, reject) {
    chrome.storage.local.get("version", ({ version }) => {
      if (version === undefined) {
        version = 0.0;
      }

      if (version === VERSION) {
        resolve();
        return;
      }

      if (version < 1.0) {
        chrome.storage.local.remove("grades");
        
        version = 1.0;
      }

      chrome.storage.local.set({ version });
      resolve();
    });
  });

  return p;
}

///
/// Utils
///

function hashString(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
  h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1>>>0);
};

function unicodeToChar(text) {
  return text.replace(/\\u[\dA-F]{4}/gi, 
  function (match) {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

///
/// DEV ONLY
///

function bglog(obj) {
  if(chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}