const path = require('path');
const app = require(path.join(__dirname, 'app'));

app.listen(app.get('port'), () => {
	const isModeProduction = app.get('mode') === 'production';
    process.stdout.write(`Express started on ${isModeProduction ? 
        `http://emote.ml on port ${app.get('port')}` : 
        `http://localhost:${app.get('port')}`}`
    );
	process.stdout.write(`; ${isModeProduction ? '' : 'press Ctrl-C to terminate'}\n`);
});
