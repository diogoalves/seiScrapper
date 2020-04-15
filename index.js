const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const moment = require('moment');
const CREDS = require('./creds');
const processos = require('./processos');
const SEIDocument = require('./models/seiDocument');


async function login(page) {
  const USERNAME_SELECTOR = '#txtUsuario';
  const PASSWORD_SELECTOR = '#pwdSenha';
  const SIGNIN_SELECTOR = '#sbmLogin';
 
  await page.goto('https://sei.ancine.gov.br/sip/login.php?sigla_orgao_sistema=ANCINE&sigla_sistema=SEI');
 
  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(CREDS.username);
  await page.waitFor(500);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(CREDS.password);
  page.click(SIGNIN_SELECTOR);

  await page.waitForNavigation();
}

async function entraProcesso(page, processo) {
  const PESQUISA_SELECTOR = '#txtPesquisaRapida';
  const ACOES_SELECTOR = '#divArvoreAcoes > a';
  
  await page.click(PESQUISA_SELECTOR);
  await page.keyboard.type(processo);
  await page.keyboard.press("Enter");

  await page.waitForNavigation();
  await page.waitFor(1*1000);
  
  let frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');

  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');
  // if(!frame) await page.waitFor(1*500); frame = await page.frames().find(f => f.name() === 'ifrVisualizacao');


  

  if(frame) {
    await frame.waitFor(1*500);
    await frame.$$eval(ACOES_SELECTOR, anchors => anchors.map((anchor) => {
      if(anchor.href.includes('procedimento_gerar_zip'))
        anchor.click()
    }));
  
    await frame.waitForNavigation();
    
    const data = await frame.$$eval('table tr td', tds => tds.map((td) => {
      return td.innerText;
    }));
    let dataResult = [];
    for(let i=0; i<data.length/4; i++) {
      const offset = i*4;
  
      const newObj = {
        process: processo,
        document: data[offset + 1],
        description: data[offset + 2],
        date: moment(data[offset + 3], "DD/MM/YYYY").toDate(),
      }
      dataResult.push(newObj);
    }
    return dataResult;
  } else {
    return null;
  }
 
}

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();
  
  await login(page);

  for(let i=0; i<processos.length; i++) {
    console.log("Processo: " + processos[i] + " | " + (i+1) + " de " + (processos.length) + " | " + ((i+1)/processos.length)*100 + "%" )
    const ret = await entraProcesso(page, processos[i]);

    if(ret) {
      console.log("  encontrou " + ret.length + " documentos") ;
      ret.map( el => {
        upsertSEIDocument(el);
      })
    } else {
      console.log(" processo não encontrado!");
      upsertSEIDocument({
        process: processos[i],
        document: "processo: " + processos[i],
        description: "não encontrado",
      })
    }
    console.log(".") ;

  }


  browser.close();
}

run();


function upsertSEIDocument(seiDocumentObj) {
	
	const DB_URL = 'mongodb://localhost/diogo';

  	if (mongoose.connection.readyState == 0) { mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }); }

  	// if this document exists, update the entry, don't insert
    const conditions = { document: seiDocumentObj.document };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  	SEIDocument.findOneAndUpdate(conditions, seiDocumentObj, options, (err, result) => {
  		if (err) throw err;
  	});
}