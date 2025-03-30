const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))

const dbConfig = {
    user: 'sa',
    password: 'p@ssw0rd',
    server: 'localhost',
    database: 'CallCreate',
    options: { encrypt: true, trustServerCertificate: true }
};

app.post('/insert-customer', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const { CustomerType, ContactPersonName, ContactNumber, Address, CompanyName, CompanyGSTNumber } = req.body;

        let query = `INSERT INTO CustomerData (CustomerType, ContactPersonName, ContactNumber, Address`;
        let values = `VALUES (@CustomerType, @ContactPersonName, @ContactNumber, @Address`;

        if (CustomerType === 'Company') {
            query += `, CompanyName, CompanyGSTNumber`;
            values += `, @CompanyName, @CompanyGSTNumber`;
        }

        query += `) ` + values + `)`;

        const request = new sql.Request();
        request.input('CustomerType', sql.VarChar, CustomerType);
        request.input('ContactPersonName', sql.VarChar, ContactPersonName);
        request.input('ContactNumber', sql.VarChar, ContactNumber);
        request.input('Address', sql.VarChar, Address);

        if (CustomerType === 'Company') {
            request.input('CompanyName', sql.VarChar, CompanyName);
            request.input('CompanyGSTNumber', sql.VarChar, CompanyGSTNumber);
        }

        await request.query(query);

        res.json({ message: 'Customer inserted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database error' });
    }
});

/*async function generateCallNumber() {
    try {
        await sql.connect(dbConfig);
        
        // Get current financial year
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const financialYear = `${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}`;

        // Find the last inserted CallNumber for the current financial year
        const result = await sql.query(`
            SELECT TOP 1 CallNumber FROM Ticket WITH (TABLOCKX)
            WHERE CallNumber LIKE 'CST/${financialYear}/%' 
            ORDER BY CallNumber DESC
        `);

        let newNumber = 1; // Default first entry
        if (result.recordset.length > 0) {
            const lastCallNumber = result.recordset[0].CallNumber;
            const lastNumber = parseInt(lastCallNumber.split('/').pop(), 10);
            newNumber = lastNumber + 1;
        }

        return `CST/${financialYear}/${newNumber}`;
    } catch (error) {
        console.error('Error generating CallNumber:', error);
        throw error;
    }   
}
*/
// Insert customer log entry
app.post('/ticket', async (req, res) => {
    try {
        //const CallNumber = await generateCallNumber()
        await sql.connect(dbConfig);

        const {
            LogDate, CustomerType, CallType, OtherCallType, CustomerMobileNumber,
            CustomerName, Address, CompanyName, CompanyGSTNumber,
            ProductName, ProductModel, ProductSerialNumber, IssueDescription, CustomerComments
        } = req.body;

        // Store OtherCallType if CallType is "Others"
        const finalCallType = CallType === "Others" ? OtherCallType : CallType;

        let query = `INSERT INTO Ticket
            (LogDate, CustomerType, CallType, CustomerName, CustomerMobileNumber, Address, ProductName, ProductModel, ProductSerialNumber, IssueDescription, CustomerComments`;
        let values = `VALUES ( @LogDate, @CustomerType, @CallType, @CustomerName, @CustomerMobileNumber, @Address, @ProductName, @ProductModel, @ProductSerialNumber, @IssueDescription, @CustomerComments`;

        if (CustomerType === 'Company') {
            query += `, CompanyName, CompanyGSTNumber`;
            values += `, @CompanyName, @CompanyGSTNumber`;
        }

        query += `) ` + values + `);`;

        const request = new sql.Request();
        request.input('CustomerType', sql.VarChar, CustomerType);
        request.input("CallType", sql.VarChar, finalCallType);
        //request.input('CallNo', sql.VarChar, CallNo);
        request.input('LogDate', sql.DateTime, LogDate);
        request.input('CustomerName', sql.VarChar, CustomerName);
        request.input('CustomerMobileNumber', sql.VarChar, CustomerMobileNumber);
        request.input('Address', sql.VarChar, Address);
        request.input('ProductName', sql.VarChar, ProductName);
        request.input('ProductModel', sql.VarChar, ProductModel);
        request.input('ProductSerialNumber', sql.VarChar, ProductSerialNumber);
        request.input('IssueDescription', sql.VarChar, IssueDescription);
        request.input('CustomerComments', sql.VarChar, CustomerComments);

        if (CustomerType === 'Company') {
            request.input('CompanyName', sql.VarChar, CompanyName);
            request.input('CompanyGSTNumber', sql.VarChar, CompanyGSTNumber);
        }

        await request.query(query);
        res.json({ message: `Customer log inserted successfully!` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database error' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
