#include "sensor_controller.hpp"
#include <crow_all.h>

int main()
{
    crow::SimpleApp app;
    initSensorRoutes(app);
    app.port(8080).multithreaded().run();
}
