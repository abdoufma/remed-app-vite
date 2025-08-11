// import { createHash } from "node:crypto";

// type User = {lastName: string, firstName: string};

// function generateLicenseCode(username : string | User){
//     if(typeof username === "string"){
//         username = username.replace(/\s/g, "")
//     }else{
//         username = (username.lastName + username.firstName).replace(/\s/g, "");
//     }
//     return createHash("md5").update(username).digest("hex").slice(0,30);
// }


// function validateLicenseCode(userCode: string, username: string | User){
//     const generatedCode = generateLicenseCode(username);
//     console.log({userCode : userCode.toLowerCase().replace(/-/g,""), generatedCode});
//     return generatedCode === userCode.toLowerCase().replace(/-/g,"");
// }



// const formatCode = (c : string) => c.includes("-") ? c : c.toUpperCase().match(/.{6}/g)!.join('-');

// const OWNER_NAME = "Benbada Abdesslam";
// const USER_NAME = {lastName : "Benbada", firstName: "Abdesslam"};
// // const USER_NAME = "Benbada Abdesslam";
// const USER_CODE = '3ABE55-D5E018-4EE5B1-3B684A-530B7E';

// // const code = generateLicenseCode(OWNER_NAME);
// // console.log("generated:", formatCode(USER_CODE));
// // const result = validateLicenseCode(USER_CODE, USER_NAME);
// // console.log(result ? "✅Valid" : "⚠️ Invalid", "For", USER_NAME);

// import { machineId } from 'node-machine-id';

// const id = await machineId(true); // same across reboots, etc.
// console.log(id);


// import si from 'systeminformation';

// const data = await si.system();
// const ifaces = await si.wifiNetworks();
// console.log(ifaces);



// function generateLicenseCode2(username : string | User, hwId: string){
//     if(typeof username === "string"){
//         username = username.replace(/\s/g, "")
//     }else{
//         username = (username.lastName + username.firstName).replace(/\s/g, "");
//     }
//     return createHash("md5").update(username).update(hwId).digest("hex").slice(0,30);
// }

// function validateLicenseCode2(userCode: string, username: string | User, hwId : string){
//     const generatedCode = generateLicenseCode2(username, hwId);
//     // console.log({userCode : userCode.toLowerCase().replace(/-/g,""), generatedCode});
//     return generatedCode === userCode.toLowerCase().replace(/-/g,"");
// }