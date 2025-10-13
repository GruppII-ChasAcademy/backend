#include "logger.hpp"
#include <fstream>
#include <ctime>

void logWarning(const std::string &sensorName, double value)
{
    std::ofstream log("varningslogg.txt", std::ios::app);
    std::time_t now = std::time(nullptr);
    log << std::ctime(&now)
        << "Sensor: " << sensorName << " | Värde: " << value << "\n";
    log.close();
}
