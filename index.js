const puppeteer = require('puppeteer');
const moment = require('moment');


const browserPromise = puppeteer.launch({
    args: [
        '--no-sandbox',
    ]
})

exports.screenshot = async (req, res) => {

    const url = 'http://corp.dewsolutions.in/lms/symfony/web/index.php/auth/login';

    const browser = await browserPromise;
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    await page.setViewport({
        width: 1920,
        height: 1080,
    });

    await page.goto(url);
    await page.waitForSelector('#btnLogin', { visible: true, timeout: 0 });

    // Login to the portal
    await page.type('#txtUsername', process.env.uname);
    await page.type('#txtPassword', process.env.pwd);
    await page.click('#btnLogin');
    await page.waitForSelector('#menu_attendance_punchIn', { visible: true, timeout: 0 });


    // Punch In/Out

    await page.goto('http://corp.dewsolutions.in/lms/symfony/web/index.php/attendance/punchIn');
    // await page.waitForSelector('.punchInbutton', {visible: true, timeout: 0});
    const today = new moment(getISTTime());
    
    isWeekDay = today.day() < 6 && today.day() > 0;
    isActiveTime = today.isSameOrAfter(moment('9:00','HH:mm')) && today.isSameOrBefore(moment('18:00','HH:mm'))

    try {
        await page.waitForSelector('.punchInbutton', {
            timeout: 1000
        });
        if(isWeekDay && isActiveTime) {
            await page.click('.punchInbutton');
            await page.waitForSelector('.punchOutbutton', { visible: true, timeout: 0 });
        }
    } catch (err) {
        if(!isActiveTime) {
            await page.click('.punchOutbutton');
            await page.waitForSelector('.punchInbutton', { visible: true, timeout: 0 });
        }
    }

    const image = await page.screenshot({ fullPage: true });


    // Logout from the portal
    await (page.click('#welcome'));
    await page.waitForSelector('#welcome-menu', { visible: true });
    await page.click('#welcome-menu > ul:nth-child(1) > li:nth-child(3) > a:nth-child(1)');

    res.setHeader('Content-type', 'image/png');
    res.send(image);

    context.close();
}

const getISTTime = () => {
    let d = new Date()
    return d.getTime() + (5.5 * 60 * 60 * 1000)
}
