const fs = require('fs');
const productCode = fs.readFileSync('src/pages/ProductMatrix/index.tsx', 'utf8');
const batterCode = fs.readFileSync('src/pages/BatterMatrix/index.tsx', 'utf8');

const mocksStart = productCode.indexOf('// --- Mocking External Dependencies for Standalone Run ---');
const modalEnd = productCode.indexOf('export default function ProductMatrix() {');

const toInject = productCode.substring(mocksStart, modalEnd);

let newBatterCode = batterCode.replace("import { MOCK_MATRIX, MOCK_STANDARDS, MOCK_MASTER, MatrixConfigModal } from '../ProductMatrix/index';", '');
newBatterCode = newBatterCode.replace("import KpiCard from '../../components/shared/KpiCard';", "import KpiCard from '../../components/shared/KpiCard';\n\n" + toInject);

// Also fix CsvUpload and CsvExport imports if they are missing in BatterMatrix
if (!newBatterCode.includes('CsvUpload')) {
  newBatterCode = newBatterCode.replace("import KpiCard", "import { CsvUpload } from '../../components/shared/CsvUpload';\nimport KpiCard");
}

fs.writeFileSync('src/pages/BatterMatrix/index.tsx', newBatterCode);
console.log('Fixed BatterMatrix');
