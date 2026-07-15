const fs = require('fs');
const file = 'components/Overview.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `          </div>
        </div>
        )}`,
  `          </div>
        </div>
        </div>
        )}`
);

fs.writeFileSync(file, content);
