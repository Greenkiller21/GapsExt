const WEBSITE = 'https://gaps.heig-vd.ch';
const URL = WEBSITE + '/consultation/controlescontinus/consultation.php';
const COOKIE_GAPS = {
  domain: 'gaps.heig-vd.ch'
};

let username = '';
let password = '';

reloadGapsGrades();

chrome.storage.sync.get("loginInfos", ({ loginInfos }) => {
  username = loginInfos.usr;
  password = loginInfos.pwd;
});

async function reloadGapsGrades() {
  bglog("start");
  document.getElementById('myDiv').innerHTML = "start";
  await removeAllCookies(COOKIE_GAPS);

  let formDataLogin = new FormData();
  formDataLogin.append('login', username);
  formDataLogin.append('password', password);
  formDataLogin.append('submit', 'Enter');

  fetch(URL,
    {
      body: formDataLogin,
      method: 'POST',
      mode: 'no-cors'
    }
  ).then((htmlLogin) => {
    htmlLogin.text().then(textLogin => {
      var args = /show_CCs\(\s*([^)]+?)\s*\);/.exec(textLogin);
      if (args[1]) {
        args = args[1].split(/\s*,\s*/);
      }

      let formDataGrades = new FormData();
      formDataGrades.append('rs', 'getStudentCCs');
      formDataGrades.append('rsargs', '[' + args[0] + ',' + args[1] + ',null]');

      fetch(URL, 
        {
          body: formDataGrades,
          method: 'POST',
          mode: 'no-cors'
        }
      ).then(async html => {
        let text = await html.text();
        text = text.substring(3, text.length - 1);
        text = text.replaceAll('\\/', '/');
        text = text.replaceAll('\\"', '"');

        var el = document.createElement('div');
        el.innerHTML = text;
        var grades = getGrades(el);
        bglog(grades);
        grades = await getGradesNotSeen(grades);
        bglog(grades);
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
            table.appendChild(tr);
          });
        }
        document.getElementById('myDiv').appendChild(table);
      });
    }).catch(error => console.log("ERROR"));
  })
}

function removeAllCookies(cookieType) {
  var promise = chrome.cookies.getAll(
    cookieType
  )
  promise.then(cookies => {
    for (var i = 0; i < cookies.length; i++) {
      console.log(cookies[i]);
      chrome.cookies.remove({
        name: cookies[i].name,
        url: WEBSITE + cookies[i].path
      });
    }
  });
  return promise;
}

function getGrades(div) {
  var table = div.firstElementChild
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
      for (newCourse in newCourses) {
        var newGrades = newCourses[newCourse];
        newGrades.forEach(newGrade => {
          bglog(newGrade);
          if (!grades[newCourse] || !grades[newCourse].contains(newGrade)) {
            if (!gradesNotSeen[newCourse]) {
              gradesNotSeen[newCourse] = [];
            }
            gradesNotSeen[newCourse].push(newGrade);
          }
        });
      }
      resolve(gradesNotSeen);
    });
  });

  return await p;
}

///
/// DEV ONLY
///

function bglog(obj) {
  if(chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}