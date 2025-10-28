#include "httplib.h"
#include "sensor_controller.hpp"
#include "swagger_controller.hpp"
#include <iostream>

int main()
{
    httplib::Server svr;

    // Registrera API-routes för sensorer
    registerSensorRoutes(svr);

    // Registrera routes för Swagger och dokumentation
    registerSwaggerRoutes(svr);

    std::cout << "✅ Servern körs på http://localhost:8080" << std::endl;
    std::cout << "📘 Swagger finns på http://localhost:8080/" << std::endl;

    // Starta servern
    svr.listen("0.0.0.0", 8080);

    return 0;
}
