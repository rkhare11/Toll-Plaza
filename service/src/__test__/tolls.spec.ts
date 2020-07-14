describe("Test suite for Tolls API", () => {
    const {app, StatusErrors} = require("../server");
    // tslint:disable-next-line: no-implicit-dependencies
    const supertest = require("supertest");

    it("Tests all tolls endpoints", async () => {

        // POST tolls
        const response = await supertest(app).post("/api/v1/tolls").send({
            vehicleRegistrationNumber: "MH14GT2378",
            amount: 200,
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("vehicleRegistrationNumber");
        expect(response.body).toHaveProperty("amount");
        expect(response.body).toHaveProperty("_id");

        // GET tolls
        const tollResponse = await supertest(app).get("/api/v1/tolls");
        expect(tollResponse.status).toBe(200);
        expect(tollResponse.body).toBeDefined();

        // PUT tolls/:id
        const updatedResponse = await supertest(app).put(`/api/v1/tolls/${response.body._id}`).send({
            vehicleRegistrationNumber: "MP10C1931",
            amount: 100,
        });
        expect(updatedResponse.status).toBe(200);
        expect(updatedResponse.body.vehicleRegistrationNumber).toBe("MP10C1931");
        expect(updatedResponse.body.amount).toBe(100);

        // DELETE tolls/:id
        await supertest(app).delete(`/api/v1/tolls/${response.body._id}`);
        const newResponse = await supertest(app).get(`/api/v1/tolls/${response.body._id}`);
        expect(newResponse.status).toBe(404);
    });

    it("Tests wrong route", async () => {
        const response = await supertest(app).get("/tolls");
        expect(response.status).toBe(404);
        expect(response.body.error.name).toBe(StatusErrors.ERR_ROUTE_404);
    });

    it("Tests invalid/bad requests", async () => {
        const response = await supertest(app).get("/api/v1/tolls/1234");
        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe(StatusErrors.ERR_400);
    });
});
