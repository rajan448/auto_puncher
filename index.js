const puppeteer = require('puppeteer');
const moment = require('moment');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SGKEY);
const browserPromise = puppeteer.launch({
    args: [
        '--no-sandbox',
    ]
})

exports.screenshot = async (req, res) => {
    const browser = await browserPromise;
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    await page.emulateTimezone('Asia/Kolkata');

    await page.goto(process.env.PORTAL_URL);
    await page.waitForSelector('#btnLogin', { visible: true, timeout: 0 });

    // Login to the portal
    await page.type('#txtUsername', process.env.uname);
    await page.type('#txtPassword', process.env.pwd);
    await page.click('#btnLogin');
    await page.waitForSelector('#menu_attendance_punchIn', { visible: true, timeout: 0 });


    // Punch In/Out

    await page.goto(process.env.PUNCHIN_URL);
    const today = new moment(getISTTime());

    isWeekDay = today.day() < 6 && today.day() > 0;
    isActiveTime = today.isSameOrAfter(moment('9:00', 'HH:mm')) && today.isSameOrBefore(moment('18:00', 'HH:mm'))

    try {
        await page.waitForSelector('.punchInbutton', {
            timeout: 500
        });
        if (isWeekDay && isActiveTime) {
            await page.click('.punchInbutton');
            await page.waitForSelector('.punchOutbutton', { visible: true, timeout: 0 });
            sgMail.send(getEmailPayload(true));
        }
    } catch (err) {
        if (!isActiveTime) {
            await page.click('.punchOutbutton');
            await page.waitForSelector('.punchInbutton', { visible: true, timeout: 0 });
            sgMail.send(getEmailPayload(false));
        }
    }

    // Logout from the portal
    await (page.click('#welcome'));
    await page.waitForSelector('#welcome-menu', { visible: true });
    await page.click('#welcome-menu > ul:nth-child(1) > li:nth-child(3) > a:nth-child(1)');

    await context.close();
}

const getISTTime = () => {
    let d = new Date()
    return d.getTime() + (5.5 * 60 * 60 * 1000)
}


const getEmailPayload = (success) => {
    return {
        to: process.env.TO,
        from: process.env.FROM,
        subject: success
            ? 'Login | ' + 'Your Today\'s Attendance'
            : 'Logout | ' + 'Your Today\'s Attendance',
        text: success
            ? `Hi There,
                We have successfully logged you in at ` + new Date(getISTTime()).toDateString()
            : `Hi There, 
                We have successfully logged you in at ` + new Date(getISTTime()).toDateString(),
        html: success
            ? `<div> Hi There,
            We have successfully logged you in at ${new Date(getISTTime()).toDateString()} </div>`
            : `Hi There, 
            We have successfully logged you in at ${new Date(getISTTime()).toDateString()} </div>`
    }
}
