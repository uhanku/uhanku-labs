-- CreateTable
CREATE TABLE `bus_schedules` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `imported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `consulted_on` VARCHAR(10) NOT NULL,
    `source` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bus_lines` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `schedule_id` INTEGER UNSIGNED NOT NULL,
    `direction` VARCHAR(64) NOT NULL,
    `day_type` VARCHAR(16) NOT NULL,
    `line_no` VARCHAR(8) NOT NULL,
    `route` VARCHAR(255) NOT NULL,
    `status` VARCHAR(255) NULL,

    INDEX `bus_lines_schedule_id_idx`(`schedule_id`),
    INDEX `bus_lines_direction_day_type_idx`(`direction`, `day_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bus_departures` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `line_id` INTEGER UNSIGNED NOT NULL,
    `time` VARCHAR(5) NOT NULL,
    `position` INTEGER NOT NULL,

    INDEX `bus_departures_line_id_idx`(`line_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bus_schedule_directions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `schedule_id` INTEGER UNSIGNED NOT NULL,
    `direction` VARCHAR(64) NOT NULL,
    `heading` VARCHAR(64) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `how_to_read` VARCHAR(255) NOT NULL,

    INDEX `bus_schedule_directions_schedule_id_idx`(`schedule_id`),
    UNIQUE INDEX `bus_schedule_directions_schedule_id_direction_key`(`schedule_id`, `direction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bus_lines` ADD CONSTRAINT `bus_lines_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `bus_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_departures` ADD CONSTRAINT `bus_departures_line_id_fkey` FOREIGN KEY (`line_id`) REFERENCES `bus_lines`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_schedule_directions` ADD CONSTRAINT `bus_schedule_directions_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `bus_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
