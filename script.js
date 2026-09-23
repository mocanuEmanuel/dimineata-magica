"use strict";

const DM_STOCARE = {
  calendar: "dimineata-magica:calendar",
  copii: "dimineata-magica:copii",
  dataSelectata: "dimineata-magica:data-selectata",
  ziSesiune: "dimineata-magica:zi-sesiune",
};

const ZILE_SAPTAMANA = ["duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"];
const ZILE_SCURTE = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
const LUNILE = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
const LUNILE_MINUSCULE = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const ANOTIMPURI = ["primavara", "vara", "toamna", "iarna"];

function anotimpSesiune() {
  const sesiune = sessionStorage.getItem(DM_STOCARE.dataSelectata) || cheieData(new Date());
  const zi = citesteJSON(DM_STOCARE.calendar, {})[sesiune];
  return zi && ANOTIMPURI.includes(zi.anotimp) ? zi.anotimp : null;
}

function aplicaFundal(numeAnotimp) {
  document.body.classList.remove("fundal-primavara", "fundal-vara", "fundal-toamna", "fundal-iarna");
  if (numeAnotimp) document.body.classList.add("fundal-" + numeAnotimp);
}

function citesteJSON(cheie, implicit) {
  try {
    const valoare = localStorage.getItem(cheie);
    return valoare === null ? implicit : JSON.parse(valoare);
  } catch {
    return implicit;
  }
}

function scrieJSON(cheie, valoare) {
  try {
    localStorage.setItem(cheie, JSON.stringify(valoare));
    return true;
  } catch {
    return false;
  }
}

function pad2(numar) {
  return String(numar).padStart(2, "0");
}

function cheieData(data) {
  return data.getFullYear() + "-" + pad2(data.getMonth() + 1) + "-" + pad2(data.getDate());
}

function formateazaNumar(numar, singular, plural) {
  return numar === 1 ? singular : plural;
}

function idNou() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function descarcaFisier(nume, continut, tip) {
  const blob = new Blob([continut], { type: tip || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const legatura = document.createElement("a");
  legatura.href = url;
  legatura.download = nume;
  document.body.appendChild(legatura);
  legatura.click();
  legatura.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const POZA_LATURA_MAX = 480;
const POZA_CALITATE = 0.85;

function citesteFisierPoza(fisier) {
  return new Promise((rezolva, respinge) => {
    if (!fisier || !fisier.type || !fisier.type.startsWith("image/")) {
      respinge(new Error("nu-e-poza"));
      return;
    }
    const cititor = new FileReader();
    cititor.onerror = () => respinge(new Error("citire"));
    cititor.onload = () => {
      const imagine = new Image();
      imagine.onerror = () => respinge(new Error("format"));
      imagine.onload = () => {
        const latime = imagine.naturalWidth || imagine.width;
        const inaltime = imagine.naturalHeight || imagine.height;
        if (!latime || !inaltime) {
          respinge(new Error("goala"));
          return;
        }
        const scara = Math.min(1, POZA_LATURA_MAX / Math.max(latime, inaltime));
        const lat = Math.max(1, Math.round(latime * scara));
        const alt = Math.max(1, Math.round(inaltime * scara));
        const panza = document.createElement("canvas");
        panza.width = lat;
        panza.height = alt;
        const context = panza.getContext("2d");
        context.drawImage(imagine, 0, 0, lat, alt);
        rezolva(panza.toDataURL("image/jpeg", POZA_CALITATE));
      };
      imagine.src = cititor.result;
    };
    cititor.readAsDataURL(fisier);
  });
}

function activeazaDragDrop(opts) {
  const surse = opts.surse;
  const tinte = opts.tinte;
  const potriveste = opts.potriveste;
  const laPlasare = opts.laPlasare;
  const laClickTinta = opts.laClickTinta || null;
  const selectorZona = opts.zona || ".zona-drop";

  let fantoma = null;
  let sursa = null;
  let ultimulDrag = 0;

  function zonaDeSubPointer(ev) {
    if (!fantoma) return null;
    fantoma.style.display = "none";
    const element = document.elementFromPoint(ev.clientX, ev.clientY);
    fantoma.style.display = "";
    return element ? element.closest(selectorZona) : null;
  }

  function curataFantoma() {
    if (fantoma) {
      fantoma.remove();
      fantoma = null;
    }
    sursa = null;
  }

  function scutura(tinta) {
    tinta.classList.remove("scuturare");
    void tinta.offsetWidth;
    tinta.classList.add("scuturare");
  }

  function intoarceFantoma() {
    if (!fantoma || !sursa) return;
    const dreptunghi = sursa.getBoundingClientRect();
    fantoma.style.transition = "left 0.25s ease, top 0.25s ease, transform 0.25s ease";
    fantoma.style.left = dreptunghi.left + dreptunghi.width / 2 + "px";
    fantoma.style.top = dreptunghi.top + dreptunghi.height / 2 + "px";
    fantoma.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
    const f = fantoma;
    fantoma = null;
    sursa = null;
    setTimeout(() => f.remove(), 260);
  }

  surse.forEach((card) => {
    card.addEventListener("dragstart", (ev) => ev.preventDefault());

    card.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      const control = ev.target.closest("button, input, a");
      if (control && control !== card) return;
      ev.preventDefault();
      const dreptunghi = card.getBoundingClientRect();
      fantoma = card.cloneNode(true);
      fantoma.classList.add("card-fantoma");
      // inline styles: cascade-proof, clasa card poate suprascrie position/z-index
      fantoma.style.position = "fixed";
      fantoma.style.zIndex = "1000";
      fantoma.style.pointerEvents = "none";
      fantoma.style.animation = "none";
      fantoma.style.transition = "none";
      fantoma.style.margin = "0";
      fantoma.style.left = ev.clientX + "px";
      fantoma.style.top = ev.clientY + "px";
      fantoma.style.width = dreptunghi.width + "px";
      document.body.appendChild(fantoma);
      sursa = card;
      card.classList.add("trasese");
      try {
        card.setPointerCapture(ev.pointerId);
      } catch {}
    });

    card.addEventListener("pointermove", (ev) => {
      if (!fantoma) return;
      fantoma.style.left = ev.clientX + "px";
      fantoma.style.top = ev.clientY + "px";
      const tinta = zonaDeSubPointer(ev);
      tinte.forEach((t) => t.classList.remove("zona-activa"));
      if (tinta && potriveste(card, tinta)) {
        tinta.classList.add("zona-activa");
      }
    });

    card.addEventListener("pointerup", (ev) => {
      if (!fantoma) return;
      ultimulDrag = Date.now();
      const tinta = zonaDeSubPointer(ev);
      tinte.forEach((t) => t.classList.remove("zona-activa"));
      if (tinta && potriveste(card, tinta)) {
        curataFantoma();
        laPlasare(tinta, card);
      } else if (tinta) {
        curataFantoma();
        scutura(tinta);
      } else {
        intoarceFantoma();
      }
      card.classList.remove("trasese");
    });

    card.addEventListener("pointercancel", () => {
      curataFantoma();
      card.classList.remove("trasese");
      tinte.forEach((t) => t.classList.remove("zona-activa"));
    });
  });

  tinte.forEach((tinta) => {
    if (tinta.dataset.clickLegat) return;
    tinta.dataset.clickLegat = "1";
    tinta.addEventListener("click", () => {
      if (Date.now() - ultimulDrag < 350) return;
      if (!laClickTinta || !tinta.querySelector(".card")) return;
      laClickTinta(tinta);
    });
  });
}

function initiazaPanouData(opts) {
  const titluData = document.getElementById("titlu-data");
  const subtitluData = document.getElementById("subtitlu-data");
  const grilaZile = document.getElementById("grila-zile");
  const butonAnterioara = document.getElementById("luna-anterioara");
  const butonUrmatoare = document.getElementById("luna-urmatoare");
  const butonAzi = document.getElementById("buton-azi");

  const azi = new Date();
  let dataSelectata = citesteDataSelectata();
  let lunaVizibila = new Date(dataSelectata.getFullYear(), dataSelectata.getMonth(), 1);

  function citesteDataSelectata() {
    const aziCheie = cheieData(azi);
    const sesiune = sessionStorage.getItem(DM_STOCARE.ziSesiune);
    if (sesiune !== aziCheie) {
      sessionStorage.setItem(DM_STOCARE.ziSesiune, aziCheie);
      sessionStorage.setItem(DM_STOCARE.dataSelectata, aziCheie);
      return azi;
    }
    const stocata = sessionStorage.getItem(DM_STOCARE.dataSelectata);
    if (stocata) {
      const parti = stocata.split("-").map(Number);
      if (parti.length === 3 && parti.every((n) => !Number.isNaN(n))) {
        return new Date(parti[0], parti[1] - 1, parti[2]);
      }
    }
    return azi;
  }

  function salveazaDataSelectata() {
    sessionStorage.setItem(DM_STOCARE.dataSelectata, cheieData(dataSelectata));
  }

  function selecteazaZi(data) {
    dataSelectata = data;
    salveazaDataSelectata();
    lunaVizibila = new Date(data.getFullYear(), data.getMonth(), 1);
    randCalendar();
    if (opts.laSchimbare) opts.laSchimbare();
  }

  function verificaZiNoua() {
    const aziCheie = cheieData(new Date());
    const sesiune = sessionStorage.getItem(DM_STOCARE.ziSesiune);
    if (sesiune !== aziCheie && cheieData(dataSelectata) === sesiune) {
      sessionStorage.setItem(DM_STOCARE.ziSesiune, aziCheie);
      selecteazaZi(new Date());
    }
  }

  function randCalendar() {
    const an = lunaVizibila.getFullYear();
    const luna = lunaVizibila.getMonth();

    titluData.textContent = LUNILE[luna] + " " + an;
    grilaZile.innerHTML = "";

    ZILE_SCURTE.forEach((nume) => {
      const cap = document.createElement("div");
      cap.className = "nume-zi-sapt";
      cap.textContent = nume;
      grilaZile.appendChild(cap);
    });

    const primul = (new Date(an, luna, 1).getDay() + 6) % 7;
    for (let i = 0; i < primul; i++) {
      grilaZile.appendChild(document.createElement("div"));
    }

    const zile = new Date(an, luna + 1, 0).getDate();
    for (let zi = 1; zi <= zile; zi++) {
      const celula = document.createElement("button");
      celula.type = "button";
      celula.className = "zi-celula";
      const eAzi = an === azi.getFullYear() && luna === azi.getMonth() && zi === azi.getDate();
      const eSelectata =
        an === dataSelectata.getFullYear() && luna === dataSelectata.getMonth() && zi === dataSelectata.getDate();
      if (eAzi) celula.classList.add("azi");
      if (eSelectata) celula.classList.add("selectata");
      if (opts.marcaDate && opts.marcaDate(cheieData(new Date(an, luna, zi)))) {
        celula.classList.add("are-date");
      }
      celula.textContent = zi;
      celula.addEventListener("click", () => selecteazaZi(new Date(an, luna, zi)));
      grilaZile.appendChild(celula);
    }

    subtitluData.textContent =
      ZILE_SAPTAMANA[dataSelectata.getDay()] +
      ", " +
      dataSelectata.getDate() +
      " " +
      LUNILE_MINUSCULE[dataSelectata.getMonth()] +
      " " +
      dataSelectata.getFullYear();
  }

  butonAnterioara.addEventListener("click", () => {
    lunaVizibila = new Date(lunaVizibila.getFullYear(), lunaVizibila.getMonth() - 1, 1);
    randCalendar();
  });

  butonUrmatoare.addEventListener("click", () => {
    lunaVizibila = new Date(lunaVizibila.getFullYear(), lunaVizibila.getMonth() + 1, 1);
    randCalendar();
  });

  if (butonAzi) {
    butonAzi.addEventListener("click", () => selecteazaZi(new Date()));
  }

  window.addEventListener("focus", verificaZiNoua);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) verificaZiNoua();
  });

  randCalendar();

  return {
    getData: () => dataSelectata,
    getCheie: () => cheieData(dataSelectata),
    actualizeaza: randCalendar,
  };
}

function initiazaCalendarul() {
  const zone = Array.from(document.querySelectorAll(".zona-drop"));
  const carti = Array.from(document.querySelectorAll(".carti .card"));
  const file = Array.from(document.querySelectorAll(".fila"));
  const grupuri = Array.from(document.querySelectorAll(".grup-fila"));

  const panou = initiazaPanouData({
    laSchimbare: actualizeazaZone,
    marcaDate: (cheie) => {
      const zi = citesteJSON(DM_STOCARE.calendar, {})[cheie];
      return !!zi && Object.values(zi).some((v) => v);
    },
  });

  migrareCalendar();
  panou.actualizeaza();

  function arataFila(nume) {
    file.forEach((fila) => fila.classList.toggle("activ", fila.dataset.fila === nume));
    grupuri.forEach((grup) => {
      grup.hidden = grup.dataset.fila !== nume;
    });
  }

  function citesteZiCurenta() {
    const toate = citesteJSON(DM_STOCARE.calendar, {});
    return toate[panou.getCheie()] || null;
  }

  function salveazaZiCurenta() {
    const toate = citesteJSON(DM_STOCARE.calendar, {});
    const stareZi = {};
    zone.forEach((zona) => {
      const card = zona.querySelector(".card");
      stareZi[zona.dataset.categorie] = card ? card.dataset.valoare : null;
    });
    toate[panou.getCheie()] = stareZi;
    scrieJSON(DM_STOCARE.calendar, toate);
    panou.actualizeaza();
  }

  function actualizeazaZone() {
    zone.forEach((zona) => {
      const card = zona.querySelector(".card");
      if (card) card.remove();
      zona.classList.remove("zona-umpluta");
    });
    const stareZi = citesteZiCurenta();
    if (stareZi) {
      zone.forEach((zona) => {
        const valoare = stareZi[zona.dataset.categorie];
        if (!valoare) return;
        const card = carti.find(
          (c) => c.dataset.categorie === zona.dataset.categorie && c.dataset.valoare === valoare
        );
        if (card) {
          zona.appendChild(card.cloneNode(true));
          zona.classList.add("zona-umpluta");
        }
      });
    }
    const zonaAnotimp = zone.find((z) => z.dataset.categorie === "anotimp");
    const cardAnotimp = zonaAnotimp ? zonaAnotimp.querySelector(".card") : null;
    aplicaFundal(cardAnotimp ? cardAnotimp.dataset.valoare : null);
  }

  function migrareCalendar() {
    const toate = citesteJSON(DM_STOCARE.calendar, {});
    const chei = Object.keys(toate);
    if (chei.length === 0) return;
    const ePerData = chei.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(c));
    if (!ePerData) {
      scrieJSON(DM_STOCARE.calendar, { [cheieData(new Date())]: toate });
    }
  }

  activeazaDragDrop({
    surse: carti,
    tinte: zone,
    potriveste: (card, tinta) => card.dataset.categorie === tinta.dataset.categorie,
    laPlasare: (tinta, card) => {
      const vechi = tinta.querySelector(".card");
      if (vechi) vechi.remove();
      tinta.appendChild(card.cloneNode(true));
      tinta.classList.add("zona-umpluta");
      salveazaZiCurenta();
      actualizeazaZone();
    },
    laClickTinta: (tinta) => {
      const card = tinta.querySelector(".card");
      card.remove();
      tinta.classList.remove("zona-umpluta");
      salveazaZiCurenta();
      actualizeazaZone();
    },
  });

  file.forEach((fila) => {
    fila.addEventListener("click", () => arataFila(fila.dataset.fila));
  });

  arataFila("zi");
  actualizeazaZone();
}

function initiazaPrezenta() {
  const lista = document.getElementById("lista-copii");
  const cutie = document.getElementById("cutie-prezenta");
  const mesajGol = document.getElementById("mesaj-gol");
  const baraNumar = document.getElementById("bara-numar");
  const inputNume = document.getElementById("input-nume");
  const butonAdauga = document.getElementById("buton-adauga");
  const butonCopie = document.getElementById("buton-copie");
  const butonImport = document.getElementById("buton-import");
  const butonCsv = document.getElementById("buton-csv");
  const inputImport = document.getElementById("input-import");
  const inputPoza = document.getElementById("input-poza");

  let copii = citesteJSON(DM_STOCARE.copii, []);
  let idPozaCurent = null;

  migrareCopii(copii);

  const panou = initiazaPanouData({
    laSchimbare: deseneaza,
    marcaDate: (cheie) => copii.some((c) => c.prezente[cheie]),
  });

  function migrareCopii(listaCopii) {
    const cheieAzi = cheieData(new Date());
    listaCopii.forEach((copil) => {
      if (!copil.prezente) copil.prezente = {};
      if (typeof copil.poza !== "string") copil.poza = null;
      if (typeof copil.stare === "string") {
        copil.prezente[cheieAzi] = copil.stare;
        delete copil.stare;
      }
    });
    scrieJSON(DM_STOCARE.copii, listaCopii);
  }

  function salveaza() {
    if (!scrieJSON(DM_STOCARE.copii, copii)) {
      alert("Nu am putut salva: spațiul din browser este plin. Fă o copie JSON (Salvează copie) și șterge poze vechi sau un browser mai curat.");
      return false;
    }
    return true;
  }

  function estePrezent(copil) {
    return copil.prezente[panou.getCheie()] === "prezent";
  }

  function marcheaza(copil, prezent) {
    const deja = copil.prezente[panou.getCheie()] === "prezent";
    if (prezent === deja) return;
    if (prezent) copil.prezente[panou.getCheie()] = "prezent";
    else delete copil.prezente[panou.getCheie()];
    salveaza();
    deseneaza();
  }

  function actualizeazaNumar(prezenti, absenti) {
    baraNumar.innerHTML = "";

    const icoana = document.createElement("img");
    icoana.src = "imagini/copii-ico.svg";
    icoana.alt = "";
    baraNumar.appendChild(icoana);

    const textPrezenti = document.createElement("span");
    textPrezenti.className = "numar-prezenti";
    textPrezenti.textContent = prezenti + " " + formateazaNumar(prezenti, "prezent", "prezenți");
    baraNumar.appendChild(textPrezenti);

    const separator = document.createElement("span");
    separator.textContent = "·";
    baraNumar.appendChild(separator);

    const textAbsenti = document.createElement("span");
    textAbsenti.className = "numar-absenti";
    textAbsenti.textContent = absenti + " " + formateazaNumar(absenti, "absent", "absenți");
    baraNumar.appendChild(textAbsenti);

    baraNumar.style.visibility = copii.length === 0 ? "hidden" : "visible";
  }

  function creeazaCartela(copil, prezent) {
    const cartela = document.createElement("li");
    cartela.className = "copil-cartela" + (prezent ? " prezent" : "");
    cartela.dataset.id = copil.id;
    cartela.title = prezent
      ? "Apasă ca să marchez «absent» sau trage poza înapoi jos"
      : "Trage poza în cutie ca să marchez «prezent»";

    const cadru = document.createElement("div");
    cadru.className = "poza-cadru";
    if (copil.poza) {
      const foto = document.createElement("img");
      foto.className = "foto";
      foto.src = copil.poza;
      foto.alt = "";
      foto.draggable = false;
      cadru.appendChild(foto);
    } else {
      const loc = document.createElement("img");
      loc.className = "loc";
      loc.src = "imagini/copii-ico.svg";
      loc.alt = "";
      cadru.appendChild(loc);
    }

    const butonPoza = document.createElement("button");
    butonPoza.type = "button";
    butonPoza.className = "buton-poza";
    butonPoza.title = copil.poza ? "Schimbă poza" : "Pune o poză";
    const icoanaPoza = document.createElement("img");
    icoanaPoza.src = "imagini/plus-ico.svg";
    icoanaPoza.alt = "Poză";
    butonPoza.appendChild(icoanaPoza);
    butonPoza.addEventListener("click", (ev) => {
      ev.stopPropagation();
      alegePoza(copil.id);
    });
    cadru.appendChild(butonPoza);
    cartela.appendChild(cadru);

    const nume = document.createElement("span");
    nume.className = "nume-copil";
    nume.textContent = copil.nume;
    cartela.appendChild(nume);

    const grupActiuni = document.createElement("div");
    grupActiuni.className = "grup-actiuni";

    const butonEdit = document.createElement("button");
    butonEdit.type = "button";
    butonEdit.className = "buton-rotund editeaza";
    butonEdit.title = "Editează numele";
    const icoanaEdit = document.createElement("img");
    icoanaEdit.src = "imagini/creion-ico.svg";
    icoanaEdit.alt = "Editează";
    butonEdit.appendChild(icoanaEdit);
    butonEdit.addEventListener("click", (ev) => {
      ev.stopPropagation();
      editeazaNume(cartela, copil);
    });

    const butonSterge = document.createElement("button");
    butonSterge.type = "button";
    butonSterge.className = "buton-rotund sterge";
    butonSterge.title = "Șterge copilul";
    const icoanaSterge = document.createElement("img");
    icoanaSterge.src = "imagini/cos-ico.svg";
    icoanaSterge.alt = "Șterge";
    butonSterge.appendChild(icoanaSterge);
    butonSterge.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (butonSterge.classList.contains("confirmare")) {
        copii = copii.filter((c) => c.id !== copil.id);
        salveaza();
        deseneaza();
        return;
      }
      butonSterge.classList.add("confirmare");
      butonSterge.textContent = "Sigur?";
      setTimeout(() => {
        butonSterge.classList.remove("confirmare");
        butonSterge.textContent = "";
        butonSterge.appendChild(icoanaSterge);
      }, 2500);
    });

    grupActiuni.append(butonEdit, butonSterge);
    cartela.appendChild(grupActiuni);
    return cartela;
  }

  function deseneaza() {
    const prezenti = copii.filter(estePrezent);
    const absenti = copii.filter((c) => !estePrezent(c));

    cutie.querySelectorAll(".copil-cartela").forEach((nod) => nod.remove());
    prezenti.forEach((copil) => cutie.appendChild(creeazaCartela(copil, true)));
    cutie.classList.toggle("zona-plina", prezenti.length > 0);

    lista.innerHTML = "";
    absenti.forEach((copil) => lista.appendChild(creeazaCartela(copil, false)));

    mesajGol.hidden = copii.length > 0;
    actualizeazaNumar(prezenti.length, absenti.length);
    panou.actualizeaza();
    legaturaDrag();
  }

  function legaturaDrag() {
    const surse = Array.from(
      document.querySelectorAll("#lista-copii .copil-cartela, #cutie-prezenta .copil-cartela")
    );
    activeazaDragDrop({
      surse: surse,
      tinte: [cutie, lista],
      zona: "[data-zona]",
      potriveste: () => true,
      laPlasare: (tinta, card) => {
        const copil = copii.find((c) => c.id === card.dataset.id);
        if (!copil) return;
        marcheaza(copil, tinta === cutie);
      },
    });
  }

  function alegePoza(id) {
    idPozaCurent = id;
    inputPoza.value = "";
    inputPoza.click();
  }

  function editeazaNume(cartela, copil) {
    const nume = cartela.querySelector(".nume-copil");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "nume-input";
    input.value = copil.nume;
    input.maxLength = 30;
    nume.replaceWith(input);
    input.focus();
    input.select();

    let terminat = false;

    function termina(salveazaModificarea) {
      if (terminat) return;
      terminat = true;
      if (salveazaModificarea) {
        const valoare = input.value.trim();
        if (valoare) copil.nume = valoare;
        salveaza();
      }
      deseneaza();
    }

    input.addEventListener("blur", () => termina(true));
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") termina(true);
      if (ev.key === "Escape") termina(false);
    });
  }

  function adaugaCopil() {
    const nume = inputNume.value.trim();
    if (!nume) {
      inputNume.focus();
      return;
    }
    copii.push({ id: idNou(), nume: nume, poza: null, prezente: {} });
    salveaza();
    inputNume.value = "";
    inputNume.focus();
    deseneaza();
  }

  function salveazaCopie() {
    const pachet = {
      aplicatie: "dimineata-magica",
      versiune: 2,
      exportat: new Date().toISOString(),
      copii: copii,
      calendar: citesteJSON(DM_STOCARE.calendar, {}),
    };
    descarcaFisier(
      "dimineata-magica-copie-" + cheieData(new Date()) + ".json",
      JSON.stringify(pachet, null, 2),
      "application/json"
    );
  }

  function campCsv(valoare) {
    const text = String(valoare == null ? "" : valoare);
    return /[";\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function exportaCsv() {
    const linii = ["nume;data;stare"];
    copii.forEach((copil) => {
      const zile = Object.keys(copil.prezente)
        .filter((k) => copil.prezente[k])
        .sort();
      if (zile.length === 0) {
        linii.push(campCsv(copil.nume) + ";;");
      } else {
        zile.forEach((zi) => linii.push(campCsv(copil.nume) + ";" + zi + ";" + copil.prezente[zi]));
      }
    });
    descarcaFisier(
      "prezenta-" + cheieData(new Date()) + ".csv",
      "\uFEFF" + linii.join("\r\n"),
      "text/csv;charset=utf-8"
    );
  }

  butonAdauga.addEventListener("click", adaugaCopil);
  inputNume.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") adaugaCopil();
  });
  butonCopie.addEventListener("click", salveazaCopie);
  butonCsv.addEventListener("click", exportaCsv);
  butonImport.addEventListener("click", () => {
    inputImport.value = "";
    inputImport.click();
  });

  inputPoza.addEventListener("change", async () => {
    const fisier = inputPoza.files && inputPoza.files[0];
    const id = idPozaCurent;
    idPozaCurent = null;
    if (!fisier || !id) return;
    try {
      const dataUrl = await citesteFisierPoza(fisier);
      const copil = copii.find((c) => c.id === id);
      if (copil) {
        copil.poza = dataUrl;
        if (!salveaza()) {
          copil.poza = null;
          deseneaza();
          return;
        }
      }
      deseneaza();
    } catch (e) {
      alert("Nu am putut citi poza. Încearcă o poză JPG sau PNG.");
    }
  });

  inputImport.addEventListener("change", () => {
    const fisier = inputImport.files && inputImport.files[0];
    if (!fisier) return;
    const cititor = new FileReader();
    cititor.onerror = () => alert("Nu am putut citi fișierul.");
    cititor.onload = () => {
      try {
        const date = JSON.parse(cititor.result);
        const listaNoua = Array.isArray(date)
          ? date
          : date && Array.isArray(date.copii)
          ? date.copii
          : null;
        if (!listaNoua || !listaNoua.every((c) => c && typeof c.nume === "string")) {
          throw new Error("format");
        }
        if (
          copii.length &&
          !confirm("Lista actuală are " + copii.length + " copii. Îi înlocuiesc cu cei din copie?")
        ) {
          return;
        }
        copii = listaNoua.map((copil) => ({
          id: typeof copil.id === "string" ? copil.id : idNou(),
          nume: copil.nume,
          poza: typeof copil.poza === "string" ? copil.poza : null,
          prezente: copil.prezente && typeof copil.prezente === "object" ? copil.prezente : {},
        }));
        migrareCopii(copii);
        salveaza();

        // calendarul jocului (opțional — backup-urile vechi nu-l au)
        let calendarOk = false;
        if (date && !Array.isArray(date) && date.calendar && typeof date.calendar === "object") {
          const cal = {};
          Object.keys(date.calendar).forEach((cheie) => {
            const zi = date.calendar[cheie];
            if (zi && typeof zi === "object" && !Array.isArray(zi)) cal[cheie] = zi;
          });
          if (Object.keys(cal).length > 0) {
            scrieJSON(DM_STOCARE.calendar, cal);
            calendarOk = true;
          }
        }

        deseneaza();
        const extra = calendarOk ? " și zilele din calendar" : "";
        alert("Am încărcat " + copii.length + " copii" + extra + ".");
      } catch (e) {
        alert("Fișierul nu pare o copie validă Dimineața Magică.");
      }
    };
    cititor.readAsText(fisier);
  });

  deseneaza();
}

function lanseazaConfeti() {
  const culori = ["#FF6B6B", "#FFD54F", "#7BC86C", "#4FC3F7", "#BA68C8", "#F48FB1", "#FFB74D"];
  for (let i = 0; i < 40; i++) {
    const piesa = document.createElement("div");
    piesa.className = "confeti";
    piesa.style.left = Math.random() * 100 + "vw";
    piesa.style.background = culori[Math.floor(Math.random() * culori.length)];
    piesa.style.animationDuration = 1.6 + Math.random() * 1.8 + "s";
    piesa.style.animationDelay = Math.random() * 0.6 + "s";
    document.body.appendChild(piesa);
    setTimeout(() => piesa.remove(), 4500);
  }
}

function initiazaEmotii() {
  const tinte = Array.from(document.querySelectorAll(".cutie-emotie"));
  const surse = Array.from(document.querySelectorAll(".panou-lateral .card"));
  const mesajFinal = document.getElementById("mesaj-final");
  const butonReset = document.getElementById("buton-reset");

  function verificaFinal() {
    const complet = tinte.every((t) => t.querySelector(".card"));
    mesajFinal.hidden = !complet;
    butonReset.hidden = !complet;
    if (complet) lanseazaConfeti();
  }

  function reseteaza() {
    tinte.forEach((t) => {
      const card = t.querySelector(".card");
      if (card) card.remove();
      t.classList.remove("zona-umpluta");
    });
    mesajFinal.hidden = true;
    butonReset.hidden = true;
  }

  activeazaDragDrop({
    surse: surse,
    tinte: tinte,
    potriveste: (card, tinta) => card.dataset.emotie === tinta.dataset.emotie,
    laPlasare: (tinta, card) => {
      const vechi = tinta.querySelector(".card");
      if (vechi) vechi.remove();
      tinta.appendChild(card.cloneNode(true));
      tinta.classList.add("zona-umpluta");
      verificaFinal();
    },
    laClickTinta: (tinta) => {
      const card = tinta.querySelector(".card");
      card.remove();
      tinta.classList.remove("zona-umpluta");
      verificaFinal();
    },
  });

  butonReset.addEventListener("click", reseteaza);
}

const DATE_ANOTIMP = {
  primavara: { nume: "Primăvara" },
  vara: { nume: "Vara" },
  toamna: { nume: "Toamna" },
  iarna: { nume: "Iarna" },
};

const TEME_ANOTIMP = {
  primavara: "tema-verde",
  vara: "tema-galben",
  toamna: "tema-portocaliu",
  iarna: "tema-albastru",
};

function initiazaAnotimpuri() {
  const main = document.getElementById("continut-anotimpuri");
  const viewAlegere = document.getElementById("view-alegere");
  const viewJoc = document.getElementById("view-joc");
  const panouCarti = document.getElementById("panou-obiecte");
  const butoaneAlegere = Array.from(document.querySelectorAll(".alegere-anotimp"));
  const butonInapoi = document.getElementById("buton-inapoi");
  const titluJoc = document.getElementById("titlu-joc");
  const etichetaAnotimp = document.getElementById("eticheta-anotimp");
  const zonaJoc = document.getElementById("zona-joc");
  const mesajFinal = document.getElementById("mesaj-final");
  const butonReset = document.getElementById("buton-reset");
  const textProgres = document.getElementById("text-progres");
  const umplereProgres = document.getElementById("umplere-progres");
  const toateCartile = Array.from(document.querySelectorAll("#carti-obiecte .card"));

  let sezonCurent = null;

  function sezonDinUrl() {
    let raw = "";
    try {
      raw = new URLSearchParams(window.location.search).get("anotimp") || "";
    } catch {}
    if (!raw) {
      const h = (window.location.hash || "").replace(/^#/, "");
      if (DATE_ANOTIMP[h]) raw = h;
    }
    return raw && DATE_ANOTIMP[raw] ? raw : null;
  }

  function scrieSezonInUrl(sezon) {
    try {
      const url = new URL(window.location.href);
      if (sezon) url.searchParams.set("anotimp", sezon);
      else url.searchParams.delete("anotimp");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch {
      try {
        if (sezon) window.location.hash = sezon;
        else window.location.hash = "";
      } catch {}
    }
  }

  function cartiActive() {
    return toateCartile.filter((c) => !c.hidden);
  }

  function amesteca() {
    const carti = Array.from(document.querySelectorAll("#carti-obiecte .card"));
    for (let i = carti.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      document.getElementById("carti-obiecte").appendChild(carti[j]);
    }
  }

  function actualizeazaProgres() {
    const act = cartiActive();
    const plasate = act.filter((s) => s.classList.contains("plasat")).length;
    textProgres.textContent = plasate + " din " + act.length + " potrivite";
    umplereProgres.style.width = (act.length ? (plasate / act.length) * 100 : 0) + "%";
  }

  function verificaFinal() {
    const act = cartiActive();
    const gata = act.length > 0 && act.every((s) => s.classList.contains("plasat"));
    mesajFinal.hidden = !gata;
    butonReset.hidden = !gata;
    if (gata) lanseazaConfeti();
  }

  function reseteaza() {
    zonaJoc.querySelectorAll(".card").forEach((c) => c.remove());
    zonaJoc.classList.remove("zona-umpluta");
    cartiActive().forEach((s) => s.classList.remove("plasat"));
    mesajFinal.hidden = true;
    butonReset.hidden = true;
    actualizeazaProgres();
    amesteca();
  }

  activeazaDragDrop({
    surse: toateCartile,
    tinte: [zonaJoc],
    potriveste: (card, tinta) =>
      !card.hidden &&
      !card.classList.contains("plasat") &&
      card.dataset.anotimp === tinta.dataset.anotimp &&
      tinta.querySelectorAll(".card").length < 4,
    laPlasare: (tinta, card) => {
      tinta.appendChild(card.cloneNode(true));
      tinta.classList.add("zona-umpluta");
      card.classList.add("plasat");
      actualizeazaProgres();
      verificaFinal();
    },
    laClickTinta: (tinta) => {
      const carduri = tinta.querySelectorAll(".card");
      if (carduri.length === 0) return;
      const ultimul = carduri[carduri.length - 1];
      const sursa = toateCartile.find((s) => s.dataset.obiect === ultimul.dataset.obiect);
      if (sursa) sursa.classList.remove("plasat");
      ultimul.remove();
      if (tinta.querySelectorAll(".card").length === 0) tinta.classList.remove("zona-umpluta");
      actualizeazaProgres();
      mesajFinal.hidden = true;
      butonReset.hidden = true;
    },
  });

  butonReset.addEventListener("click", reseteaza);

  butoaneAlegere.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sezon = btn.dataset.anotimp;
      scrieSezonInUrl(sezon);
      pornesteJoc(sezon, btn);
    });
  });

  butonInapoi.addEventListener("click", () => {
    scrieSezonInUrl(null);
    arataAlegerea();
  });

  function arataAlegerea() {
    sezonCurent = null;
    main.classList.add("continut-singur");
    viewAlegere.hidden = false;
    viewJoc.hidden = true;
    panouCarti.hidden = true;
    aplicaFundal(anotimpSesiune());
  }

  function pornesteJoc(sezon, btn) {
    sezonCurent = sezon;
    const info = DATE_ANOTIMP[sezon];
    const pict = btn ? btn.querySelector("img") : null;
    const srcZana = pict ? pict.getAttribute("src") : "imagini/zana-" + sezon + ".jpg";
    const tema = (btn && Array.from(btn.classList).find((c) => c.startsWith("tema-"))) || TEME_ANOTIMP[sezon] || "";

    main.classList.remove("continut-singur");
    viewAlegere.hidden = true;
    viewJoc.hidden = false;
    panouCarti.hidden = false;

    titluJoc.textContent = info.nume;
    etichetaAnotimp.textContent = info.nume;
    zonaJoc.dataset.anotimp = sezon;
    zonaJoc.className = "zona-drop zona-anotimp " + tema;
    zonaJoc.style.setProperty("--zana", 'url("' + srcZana + '")');
    document.title = info.nume + " — Întâlnirea de dimineață";

    toateCartile.forEach((c) => {
      c.hidden = c.dataset.anotimp !== sezon;
      c.classList.remove("plasat");
    });
    zonaJoc.querySelectorAll(".card").forEach((c) => c.remove());
    zonaJoc.classList.remove("zona-umpluta");
    mesajFinal.hidden = true;
    butonReset.hidden = true;
    aplicaFundal(sezon);
    amesteca();
    actualizeazaProgres();
  }

  const sezonInitial = sezonDinUrl();
  if (sezonInitial) {
    const btn = butoaneAlegere.find((b) => b.dataset.anotimp === sezonInitial);
    pornesteJoc(sezonInitial, btn);
  } else {
    arataAlegerea();
  }
}

const pagina = document.body.dataset.pagina;
if (pagina === "calendar") initiazaCalendarul();
if (pagina === "prezenta") initiazaPrezenta();
if (pagina === "emotii") initiazaEmotii();
if (pagina === "anotimpuri") initiazaAnotimpuri();
if (pagina !== "anotimpuri") aplicaFundal(anotimpSesiune());
